# 🚀 Hướng dẫn Implement TSX Pages từ AI Studio vào Next.js

## 📋 Mục lục
1. [Hiểu về Next.js App Router](#1-hiểu-về-nextjs-app-router)
2. [Cách chuyển đổi code từ AI Studio](#2-cách-chuyển-đổi-code-từ-ai-studio)
3. [Ví dụ thực tế](#3-ví-dụ-thực-tế)
4. [Các lỗi thường gặp](#4-các-lỗi-thường-gặp)

---

## 1. Hiểu về Next.js App Router

### 🗂️ Cấu trúc thư mục
```
app/
├── page.tsx              → Trang chủ (/)
├── layout.tsx            → Layout chung cho toàn app
├── globals.css           → CSS toàn cục
├── dashboard/
│   ├── page.tsx          → Route: /dashboard
│   └── layout.tsx        → Layout riêng cho dashboard
├── approvals/
│   └── page.tsx          → Route: /approvals
└── components/           → Components dùng chung (không tạo route)
    ├── Navbar.tsx
    ├── Sidebar.tsx
    └── ApprovalCard.tsx
```

### 📌 Quy tắc quan trọng:
- **`page.tsx`**: File này tạo ra một route có thể truy cập
- **`layout.tsx`**: Wrapper chung cho các page con
- **`components/`**: Folder chứa components (KHÔNG tạo route)
- **File names**: Phải là `page.tsx`, `layout.tsx` (chữ thường)

---

## 2. Cách chuyển đổi code từ AI Studio

### ✅ Bước 1: Phân loại file

Từ code AI Studio, bạn cần xác định:

| File AI Studio | Loại | Đặt ở đâu trong Next.js |
|----------------|------|-------------------------|
| `App.tsx` | Main component | → `app/page.tsx` hoặc `app/layout.tsx` |
| `Navbar.tsx` | Component | → `app/components/Navbar.tsx` |
| `Sidebar.tsx` | Component | → `app/components/Sidebar.tsx` |
| `LandingPage.tsx` | Page | → `app/page.tsx` hoặc `app/landing/page.tsx` |
| `Dashboard.tsx` | Page | → `app/dashboard/page.tsx` |
| `ApprovalCam.tsx` | Page | → `app/approvals/page.tsx` |
| `types.ts` | Types | → `app/types.ts` hoặc `types/index.ts` |

### ✅ Bước 2: Sửa đổi code

#### **A. Components (Navbar, Sidebar, etc.)**

**Code từ AI Studio:**
```tsx
// Navbar.tsx (từ AI Studio)
import React from 'react';

export default function Navbar() {
  return <nav>...</nav>;
}
```

**Chuyển sang Next.js:**
```tsx
// app/components/Navbar.tsx
'use client'; // ← Thêm dòng này nếu dùng useState, useEffect, onClick, etc.

import React from 'react';

export default function Navbar() {
  return <nav>...</nav>;
}
```

> **Khi nào cần `'use client'`?**
> - Khi dùng React hooks: `useState`, `useEffect`, `useContext`
> - Khi dùng event handlers: `onClick`, `onChange`, `onSubmit`
> - Khi dùng browser APIs: `window`, `localStorage`, `document`

#### **B. Pages**

**Code từ AI Studio:**
```tsx
// Dashboard.tsx (từ AI Studio)
import React from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

export default function Dashboard() {
  return (
    <div>
      <Navbar />
      <Sidebar />
      <main>Dashboard Content</main>
    </div>
  );
}
```

**Chuyển sang Next.js:**
```tsx
// app/dashboard/page.tsx
'use client';

import Navbar from '@/app/components/Navbar';
import Sidebar from '@/app/components/Sidebar';

export default function DashboardPage() {
  return (
    <div>
      <Navbar />
      <Sidebar />
      <main>Dashboard Content</main>
    </div>
  );
}
```

> **Lưu ý:**
> - Import path dùng `@/app/...` (alias được config sẵn trong `tsconfig.json`)
> - Đổi tên function thành `DashboardPage` (tùy chọn, nhưng rõ ràng hơn)

#### **C. Layout chung**

Nếu nhiều page dùng chung Navbar + Sidebar, tạo layout:

```tsx
// app/layout.tsx
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Smart Office',
  description: 'Smart Office Management System',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
```

Hoặc tạo layout riêng cho dashboard:

```tsx
// app/dashboard/layout.tsx
'use client';

import Navbar from '@/app/components/Navbar';
import Sidebar from '@/app/components/Sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1">
        <Navbar />
        <main>{children}</main>
      </div>
    </div>
  );
}
```

Khi đó, `app/dashboard/page.tsx` chỉ cần:

```tsx
// app/dashboard/page.tsx
'use client';

export default function DashboardPage() {
  return <div>Dashboard Content</div>;
}
```

---

## 3. Ví dụ thực tế

### 📝 Ví dụ: Tạo trang Approvals

**Bước 1: Tạo folder và file**
```
app/
└── approvals/
    └── page.tsx
```

**Bước 2: Copy code từ AI Studio**

Giả sử bạn có code này từ AI Studio:

```tsx
// ApprovalCam.tsx (AI Studio)
import React, { useState } from 'react';
import { CheckSquare, Package, BarChart3 } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab }) => {
  const menuItems = [
    { id: 'approvals', icon: CheckSquare, label: 'Approvals' },
    { id: 'resources', icon: Package, label: 'Resources' },
    { id: 'analytics', icon: BarChart3, label: 'Analytics' },
  ];

  return (
    <nav>
      {menuItems.map((item) => (
        <button key={item.id}>{item.label}</button>
      ))}
    </nav>
  );
};

export default function ApprovalCam() {
  const [activeTab, setActiveTab] = useState('approvals');

  return (
    <div>
      <Sidebar activeTab={activeTab} />
      <main>Approval Content</main>
    </div>
  );
}
```

**Bước 3: Chuyển đổi**

```tsx
// app/approvals/page.tsx
'use client'; // ← Vì dùng useState

import React, { useState } from 'react';
import { CheckSquare, Package, BarChart3 } from 'lucide-react';

// Interface giữ nguyên
interface SidebarProps {
  activeTab: string;
}

// Component Sidebar - có thể tách ra file riêng
const Sidebar: React.FC<SidebarProps> = ({ activeTab }) => {
  const menuItems = [
    { id: 'approvals', icon: CheckSquare, label: 'Approvals' },
    { id: 'resources', icon: Package, label: 'Resources' },
    { id: 'analytics', icon: BarChart3, label: 'Analytics' },
  ];

  return (
    <nav className="w-64 bg-white h-screen flex flex-col border-r border-gray-100 sticky top-0">
      {menuItems.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            className={`w-full flex items-center gap-2 px-4 py-3 ${
              activeTab === item.id ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50'
            }`}
          >
            <Icon size={20} />
            {item.label}
          </button>
        );
      })}
    </nav>
  );
};

// Main page component
export default function ApprovalsPage() {
  const [activeTab, setActiveTab] = useState('approvals');

  return (
    <div className="flex">
      <Sidebar activeTab={activeTab} />
      <main className="flex-1 p-6">
        <h1 className="text-2xl font-bold">Approval Management</h1>
      </main>
    </div>
  );
}
```

**Bước 4: Truy cập**
- Chạy `npm run dev`
- Mở trình duyệt: `http://localhost:3000/approvals`

---

## 4. Các lỗi thường gặp

### ❌ Lỗi 1: "You're importing a component that needs useState..."

**Nguyên nhân:** Quên thêm `'use client'`

**Giải pháp:**
```tsx
'use client'; // ← Thêm dòng này ở đầu file

import { useState } from 'react';
```

---

### ❌ Lỗi 2: "Module not found: Can't resolve '@/components/...'"

**Nguyên nhân:** Import path sai

**Giải pháp:**
```tsx
// ❌ Sai
import Navbar from '@/components/Navbar';

// ✅ Đúng
import Navbar from '@/app/components/Navbar';
```

---

### ❌ Lỗi 3: "Page not found (404)"

**Nguyên nhân:** File không đặt đúng tên hoặc vị trí

**Giải pháp:**
- Phải đặt tên là `page.tsx` (chữ thường)
- Phải nằm trong folder tương ứng với route

```
✅ app/dashboard/page.tsx → /dashboard
❌ app/dashboard/Dashboard.tsx → Không tạo route
```

---

### ❌ Lỗi 4: CSS không hoạt động

**Nguyên nhân:** Chưa import Tailwind CSS

**Giải pháp:**
```tsx
// app/layout.tsx
import './globals.css'; // ← Đảm bảo có dòng này
```

---

## 5. Checklist khi implement

- [ ] Xác định file nào là **page**, file nào là **component**
- [ ] Tạo folder structure đúng trong `app/`
- [ ] Thêm `'use client'` cho components có state/events
- [ ] Sửa import paths (dùng `@/app/...`)
- [ ] Đổi tên file thành `page.tsx` cho routes
- [ ] Test trên browser (`npm run dev`)

---

## 6. Tips hữu ích

### 💡 Tip 1: Tách components ra file riêng

Thay vì viết tất cả trong một file, tách ra:

```
app/
├── approvals/
│   └── page.tsx
└── components/
    ├── Sidebar.tsx
    ├── Navbar.tsx
    └── ApprovalCard.tsx
```

### 💡 Tip 2: Dùng TypeScript interfaces

Tạo file `types.ts` để quản lý types:

```tsx
// app/types.ts
export interface SidebarProps {
  activeTab: string;
}

export interface MenuItem {
  id: string;
  icon: any;
  label: string;
}
```

### 💡 Tip 3: Dùng layout cho code gọn hơn

Thay vì lặp lại Navbar/Sidebar ở mỗi page, dùng layout:

```tsx
// app/dashboard/layout.tsx
export default function DashboardLayout({ children }) {
  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1">
        <Navbar />
        {children}
      </div>
    </div>
  );
}
```

---

## 7. Tài liệu tham khảo

- [Next.js App Router Docs](https://nextjs.org/docs/app)
- [Next.js Routing](https://nextjs.org/docs/app/building-your-application/routing)
- [Client Components](https://nextjs.org/docs/app/building-your-application/rendering/client-components)

---

**Chúc bạn code vui vẻ! 🎉**
