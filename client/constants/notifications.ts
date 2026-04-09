import { ArrowLeftRight, TrendingUp, AlertCircle } from 'lucide-react';

export const notifications = [
  {
    id: 1,
    icon: ArrowLeftRight,
    title: 'Transaction completed',
    description: 'Payment of $240.00 to Netflix was processed.',
    time: '2m ago',
    unread: true
  },
  {
    id: 2,
    icon: TrendingUp,
    title: 'Investment update',
    description: 'Your portfolio grew by 3.2% this week.',
    time: '1h ago',
    unread: true
  },
  {
    id: 3,
    icon: AlertCircle,
    title: 'Spending alert',
    description: "You've reached 86% of your monthly budget.",
    time: '3h ago',
    unread: false
  },
  {
    id: 4,
    icon: ArrowLeftRight,
    title: 'Transfer received',
    description: 'John Doe sent you $1,500.00.',
    time: 'Yesterday',
    unread: false
  }
];
