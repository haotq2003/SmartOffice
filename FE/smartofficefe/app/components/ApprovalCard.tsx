'use client';

import React from 'react';
import { Calendar, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { RequestCard } from '../types';

interface ApprovalCardProps {
    request: RequestCard;
}

const ApprovalCard: React.FC<ApprovalCardProps> = ({ request }) => {
    return (
        <div className="bg-white rounded-xl border-l-4 border-l-blue-600 shadow-sm border border-gray-100 p-6 mb-4 flex gap-6 hover:shadow-md transition-shadow">
            {/* User Info & Main Details */}
            <div className="flex-1">
                <div className="flex items-start gap-4 mb-4">
                    <img
                        src={request.userAvatar}
                        alt={request.userName}
                        className="w-12 h-12 rounded-full object-cover"
                    />
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="font-bold text-gray-900">{request.userName}</h3>
                            <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 bg-blue-50 text-blue-600 rounded">
                                {request.department}
                            </span>
                        </div>
                        <p className="text-sm text-gray-500">
                            Requested <span className="text-blue-600 font-semibold">{request.resourceName}</span>
                        </p>
                    </div>
                </div>

                <div className="flex gap-6 mb-4">
                    <div className="flex items-center gap-2 text-gray-500 text-sm">
                        <Calendar size={16} />
                        <span>{request.dateRange}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-500 text-sm">
                        <Clock size={16} />
                        <span>{request.timeRange} {request.duration && `(${request.duration})`}</span>
                    </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Purpose</span>
                    <p className="text-sm text-gray-600 italic">&quot;{request.purpose}&quot;</p>
                </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3 w-48 justify-center">
                <button className="flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors">
                    <CheckCircle2 size={18} />
                    Approve
                </button>
                <button className="flex items-center justify-center gap-2 bg-white border border-red-100 text-red-500 py-3 rounded-xl font-bold hover:bg-red-50 transition-colors">
                    <XCircle size={18} />
                    Reject
                </button>
            </div>
        </div>
    );
};

export default ApprovalCard;
