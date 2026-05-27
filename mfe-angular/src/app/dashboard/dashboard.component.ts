import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Order {
  id: string;
  customer: string;
  product: string;
  amount: number;
  status: 'pending' | 'completed' | 'cancelled';
  date: string;
}

interface Stat {
  label: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit, OnDestroy {
  @Input() userId: string = '';
  @Input() theme: string = 'light';

  currentTime: string = '';
  private timeInterval: any;

  stats: Stat[] = [
    { label: 'Total Revenue', value: 'Rp 45.2M', change: '+12.5%', trend: 'up' },
    { label: 'Active Orders', value: '156', change: '+8.3%', trend: 'up' },
    { label: 'Total Customers', value: '2,847', change: '+23.1%', trend: 'up' },
    { label: 'Conversion Rate', value: '3.2%', change: '-0.8%', trend: 'down' },
  ];

  orders: Order[] = [
    { id: 'ORD-001', customer: 'John Doe', product: 'Wireless Headphones', amount: 1250000, status: 'completed', date: '2025-05-26' },
    { id: 'ORD-002', customer: 'Jane Smith', product: 'Ergonomic Keyboard', amount: 890000, status: 'pending', date: '2025-05-26' },
    { id: 'ORD-003', customer: 'Bob Johnson', product: 'Running Shoes', amount: 750000, status: 'completed', date: '2025-05-25' },
    { id: 'ORD-004', customer: 'Alice Brown', product: 'Coffee Maker', amount: 450000, status: 'cancelled', date: '2025-05-25' },
    { id: 'ORD-005', customer: 'Charlie Wilson', product: 'Smart Watch', amount: 2100000, status: 'pending', date: '2025-05-24' },
  ];

  formatPrice(price: number): string {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  }

  ngOnInit() {
    this.updateTime();
    this.timeInterval = setInterval(() => this.updateTime(), 1000);
  }

  ngOnDestroy() {
    if (this.timeInterval) {
      clearInterval(this.timeInterval);
    }
  }

  private updateTime() {
    this.currentTime = new Date().toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }
}
