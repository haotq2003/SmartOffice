// Added import to resolve 'React' namespace for ReactNode
import React from 'react';

export enum AppRole {
  GUEST = 'GUEST',
  MANAGER = 'MANAGER',
  EMPLOYEE = 'EMPLOYEE'
}

export interface RequestCard {
  id: string;
  userName: string;
  userAvatar: string;
  department: string;
  resourceName: string;
  dateRange: string;
  timeRange: string;
  duration?: string;
  purpose: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface NavItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
}
