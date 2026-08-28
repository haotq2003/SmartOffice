const crypto = require('crypto');
const querystring = require('qs');
const Tenant = require('../models/Tenant');
const Plan = require('../models/Plan');
const Transaction = require('../models/Transaction');

const VNP_TMNCODE = process.env.VNP_TMNCODE || 'PYTUO2XZ';
const VNP_HASHSECRET = process.env.VNP_HASHSECRET || '8XVE4M1JD8CDADJMI1P2U759WW4UL1OT';
const VNP_URL = process.env.VNP_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
const VNP_RETURNURL = process.env.VNP_RETURNURL || 'http://localhost:3000/payment-return';

function sortObject(obj) {
    let sorted = {};
    let str = [];
    let key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) {
            str.push(encodeURIComponent(key));
        }
    }
    str.sort();
    for (key = 0; key < str.length; key++) {
        sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, "+");
    }
    return sorted;
}

const createPaymentUrl = async (req, res) => {
    try {
        const { planCode, priceUSD, months, tenantId } = req.body;

        const exchangeRate = 25400;
        let amountVND = Math.round((priceUSD || 49) * (months || 12) * exchangeRate);

        if (months === 12) {
            amountVND = Math.round(amountVND * 0.85); // 15% discount for 12 months
        }

        const date = new Date();
        const createDate = date.getFullYear().toString() +
            ("0" + (date.getMonth() + 1)).slice(-2) +
            ("0" + date.getDate()).slice(-2) +
            ("0" + date.getHours()).slice(-2) +
            ("0" + date.getMinutes()).slice(-2) +
            ("0" + date.getSeconds()).slice(-2);

        const orderId = date.getTime().toString();
        const orderInfo = `Thanh toan gia han goi ${planCode || 'premium'} (${months || 12} thang) SmartOffice`;
        const orderType = 'billpayment';
        const locale = 'vn';
        const currCode = 'VND';

        let vnp_Params = {};
        vnp_Params['vnp_Version'] = '2.1.0';
        vnp_Params['vnp_Command'] = 'pay';
        vnp_Params['vnp_TmnCode'] = VNP_TMNCODE;
        vnp_Params['vnp_Locale'] = locale;
        vnp_Params['vnp_CurrCode'] = currCode;
        vnp_Params['vnp_TxnRef'] = orderId;
        vnp_Params['vnp_OrderInfo'] = orderInfo;
        vnp_Params['vnp_OrderType'] = orderType;
        vnp_Params['vnp_Amount'] = amountVND * 100; // VNPay requires amount * 100
        vnp_Params['vnp_ReturnUrl'] = VNP_RETURNURL;
        vnp_Params['vnp_IpAddr'] = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
        if (req.body.bankCode) {
            vnp_Params['vnp_BankCode'] = req.body.bankCode;
        }

        vnp_Params = sortObject(vnp_Params);

        const signData = querystring.stringify(vnp_Params, { encode: false });
        const hmac = crypto.createHmac('sha512', VNP_HASHSECRET);
        const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

        vnp_Params['vnp_SecureHash'] = signed;

        const paymentUrl = VNP_URL + '?' + querystring.stringify(vnp_Params, { encode: false });

        return res.status(200).json({
            success: true,
            paymentUrl,
            orderId,
            amountVND
        });
    } catch (error) {
        console.error('Error creating VNPay payment URL:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

const vnpayReturn = async (req, res) => {
    try {
        let vnp_Params = req.query;
        const secureHash = vnp_Params['vnp_SecureHash'];

        delete vnp_Params['vnp_SecureHash'];
        delete vnp_Params['vnp_SecureHashType'];

        vnp_Params = sortObject(vnp_Params);

        const signData = querystring.stringify(vnp_Params, { encode: false });
        const hmac = crypto.createHmac('sha512', VNP_HASHSECRET);
        const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

        const isSuccess = secureHash === signed && vnp_Params['vnp_ResponseCode'] === '00';

        if (isSuccess) {
            const orderInfo = vnp_Params['vnp_OrderInfo'] || '';
            let planCode = 'premium';
            if (orderInfo.toLowerCase().includes('free')) planCode = 'free';
            if (orderInfo.toLowerCase().includes('enterprise')) planCode = 'enterprise';

            let monthsToAdd = 12;
            const match = orderInfo.match(/\((\d+)\s*thang\)/i);
            if (match && match[1]) {
                monthsToAdd = parseInt(match[1]);
            }

            const tenant = await Tenant.findOne();
            if (tenant) {
                const now = new Date();
                const isSamePlan = tenant.plan === planCode;
                let baseDate = (isSamePlan && tenant.planExpiredAt && new Date(tenant.planExpiredAt) > now)
                    ? new Date(tenant.planExpiredAt)
                    : new Date();
                baseDate.setMonth(baseDate.getMonth() + monthsToAdd);

                tenant.plan = planCode;
                tenant.planExpiredAt = baseDate;
                await tenant.save();

                await Transaction.create({
                    tenantId: tenant._id,
                    planCode,
                    amountUSD: planCode === 'enterprise' ? 199 : planCode === 'premium' ? 49 : 0,
                    amountVND: parseInt(vnp_Params['vnp_Amount']) / 100 || 0,
                    months: monthsToAdd,
                    paymentMethod: 'vnpay',
                    transactionRef: vnp_Params['vnp_TransactionNo'] || vnp_Params['vnp_TxnRef'] || `VNP_${Date.now()}`,
                    status: 'success'
                }).catch(e => console.error('Transaction log error:', e));
            }
        }

        return res.status(200).json({
            success: isSuccess,
            code: vnp_Params['vnp_ResponseCode'],
            message: isSuccess ? 'Thanh toán thành công qua VNPay Sandbox' : 'Thanh toán không thành công',
            data: vnp_Params
        });
    } catch (error) {
        console.error('Error verifying VNPay return:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

const https = require('https');

const makeMomoRequest = (requestType, amountVND, partnerCode, accessKey, secretKey, redirectUrl, ipnUrl, planCode, months, tenantId) => {
    return new Promise((resolve, reject) => {
        const requestId = partnerCode + new Date().getTime();
        const orderId = requestId;
        const orderInfo = `Thanh toan gia han goi ${planCode || 'premium'} (${months || 12} thang) SmartOffice`;
        const amount = amountVND.toString();
        const extraDataPayload = { tenantId: tenantId ? tenantId.toString() : null, months: months || 12 };
        const extraData = Buffer.from(JSON.stringify(extraDataPayload)).toString('base64');

        const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;

        const signature = crypto.createHmac('sha256', secretKey)
            .update(rawSignature)
            .digest('hex');

        const requestBody = JSON.stringify({
            partnerCode,
            partnerName: "SmartOffice SaaS",
            storeId: "SmartOfficeStore",
            requestId,
            amount,
            orderId,
            orderInfo,
            redirectUrl,
            ipnUrl,
            lang: 'vi',
            requestType,
            autoCapture: true,
            extraData,
            signature
        });

        const options = {
            hostname: 'test-payment.momo.vn',
            port: 443,
            path: '/v2/gateway/api/create',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(requestBody)
            }
        };

        const momoReq = https.request(options, (momoRes) => {
            let data = '';
            momoRes.on('data', (chunk) => { data += chunk; });
            momoRes.on('end', () => {
                try {
                    const responseData = JSON.parse(data);
                    resolve({ responseData, orderId });
                } catch (e) {
                    reject(e);
                }
            });
        });

        momoReq.on('error', (e) => reject(e));
        momoReq.write(requestBody);
        momoReq.end();
    });
};

const createMomoUrl = async (req, res) => {
    try {
        const { planCode, priceUSD, months, tenantId, requestType: requestedType } = req.body;

        const exchangeRate = 25400;
        let amountVND = Math.round((priceUSD || 49) * (months || 12) * exchangeRate);
        if (months === 12) {
            amountVND = Math.round(amountVND * 0.85);
        }

        const partnerCode = process.env.MOMO_PARTNER_CODE || 'MOMO';
        const accessKey = process.env.MOMO_ACCESS_KEY || 'F8BBA842ECF85';
        const secretKey = process.env.MOMO_SECRET_KEY || 'K951B6PE1waDMi640xX08PD3vg6EkVlz';
        const redirectUrl = process.env.MOMO_REDIRECT_URL || 'http://localhost:3000/payment-return';
        const ipnUrl = process.env.MOMO_IPN_URL || 'http://localhost:3000/payment-return';

        const preferredType = 'payWithATM';
        let result = await makeMomoRequest(preferredType, amountVND, partnerCode, accessKey, secretKey, redirectUrl, ipnUrl, planCode, months, tenantId).catch((err) => ({ responseData: { resultCode: 99, message: err.message } }));

        if (result && result.responseData?.resultCode === 0 && result.responseData?.payUrl) {
            return res.status(200).json({
                success: true,
                payUrl: result.responseData.payUrl,
                qrCodeUrl: result.responseData.qrCodeUrl,
                deeplink: result.responseData.deeplink,
                orderId: result.orderId,
                amountVND
            });
        } else {
            return res.status(400).json({
                success: false,
                message: result?.responseData?.message || 'Lỗi tạo liên kết thanh toán MoMo',
                data: result?.responseData
            });
        }
    } catch (error) {
        console.error('Error creating MoMo payment URL:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

const verifyMomoReturn = async (req, res) => {
    try {
        const { resultCode, orderInfo, amount, orderId, transId, extraData } = req.query;
        const isSuccess = resultCode === '0' || resultCode === 0;

        if (isSuccess) {
            const infoStr = orderInfo || '';
            let planCode = 'premium';
            if (infoStr.toLowerCase().includes('free')) planCode = 'free';
            if (infoStr.toLowerCase().includes('enterprise')) planCode = 'enterprise';

            let paidMonths = 12;
            let targetTenantId = null;

            if (extraData) {
                try {
                    const decoded = Buffer.from(extraData, 'base64').toString('utf-8');
                    if (decoded.startsWith('{')) {
                        const parsed = JSON.parse(decoded);
                        targetTenantId = parsed.tenantId;
                        paidMonths = parseInt(parsed.months) || 12;
                    } else {
                        targetTenantId = decoded;
                    }
                } catch (e) {}
            }

            if (!paidMonths && infoStr.includes('thang')) {
                const match = infoStr.match(/\((\d+)\s*thang\)/i);
                if (match && match[1]) {
                    paidMonths = parseInt(match[1]);
                }
            }

            const planObj = await Plan.findOne({ code: planCode });
            const priceUSD = planObj ? planObj.price : (planCode === 'enterprise' ? 199 : planCode === 'premium' ? 49 : 0);
            const amountVND = amount ? parseInt(amount) : priceUSD * 25400;

            let tenant = null;
            if (targetTenantId) {
                tenant = await Tenant.findById(targetTenantId);
            }
            if (!tenant) {
                tenant = await Tenant.findOne();
            }

            if (tenant) {
                const now = new Date();
                const isSamePlan = tenant.plan === planCode;
                let baseDate = (isSamePlan && tenant.planExpiredAt && new Date(tenant.planExpiredAt) > now)
                    ? new Date(tenant.planExpiredAt)
                    : new Date();
                baseDate.setMonth(baseDate.getMonth() + (paidMonths || 12));

                tenant.plan = planCode;
                tenant.planExpiredAt = baseDate;
                tenant.monthlyRevenue = priceUSD;
                tenant.totalRevenue = (tenant.totalRevenue || 0) + priceUSD;
                await tenant.save();

                await Transaction.create({
                    tenantId: tenant._id,
                    planCode,
                    amountUSD: priceUSD,
                    amountVND,
                    months: paidMonths || 12,
                    paymentMethod: 'momo',
                    transactionRef: orderId || transId || `MOMO_${Date.now()}`,
                    status: 'success'
                }).catch(e => console.error('Transaction log error:', e));
            }
        }

        return res.status(200).json({
            success: isSuccess,
            code: resultCode,
            message: isSuccess ? 'Thanh toán MoMo Sandbox thành công!' : 'Thanh toán MoMo không thành công',
            data: req.query
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const getAllTransactions = async (req, res) => {
    try {
        const { page, limit, status, paymentMethod, search, tenantId } = req.query;

        let query = {};

        if (status) {
            query.status = status;
        }

        if (paymentMethod) {
            query.paymentMethod = paymentMethod;
        }

        if (tenantId) {
            query.tenantId = tenantId;
        }

        if (search) {
            query.$or = [
                { transactionRef: { $regex: search, $options: 'i' } },
                { planCode: { $regex: search, $options: 'i' } }
            ];
        }

        let transactionsQuery = Transaction.find(query)
            .populate('tenantId', 'name domain plan email')
            .sort({ createdAt: -1 });

        const total = await Transaction.countDocuments(query);

        const stats = await Transaction.aggregate([
            { $match: { ...query, status: 'success' } },
            {
                $group: {
                    _id: null,
                    totalVND: { $sum: '$amountVND' },
                    totalUSD: { $sum: '$amountUSD' }
                }
            }
        ]);

        const summary = {
            totalVND: stats[0]?.totalVND || 0,
            totalUSD: stats[0]?.totalUSD || 0
        };

        let pageNum = parseInt(page);
        let limitNum = parseInt(limit);

        if (pageNum && limitNum) {
            const skip = (pageNum - 1) * limitNum;
            transactionsQuery = transactionsQuery.skip(skip).limit(limitNum);
        }

        const transactions = await transactionsQuery;

        return res.status(200).json({
            success: true,
            count: transactions.length,
            total,
            page: pageNum || 1,
            totalPages: limitNum ? Math.ceil(total / limitNum) : 1,
            summary,
            data: transactions
        });
    } catch (error) {
        console.error('Error fetching transactions:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    createPaymentUrl,
    vnpayReturn,
    createMomoUrl,
    verifyMomoReturn,
    getAllTransactions
};
