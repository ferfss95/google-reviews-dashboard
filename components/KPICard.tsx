'use client';

import { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export default function KPICard({
  title,
  value,
  subtitle,
  icon,
  trend,
  className = '',
}: KPICardProps) {
  // Se não tem className customizado, assume estilo padrão (branco)
  const isHighlighted = className.includes('bg-red-700') || className.includes('bg-primary-700');
  
  return (
    <Card className={cn(
      isHighlighted && 'bg-primary text-primary-foreground',
      className
    )}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className={cn(
              'text-sm font-medium mb-1',
              isHighlighted ? 'text-primary-foreground/90' : 'text-muted-foreground'
            )}>
              {title}
            </p>
            <p className={cn(
              'text-3xl font-bold',
              isHighlighted ? 'text-primary-foreground' : 'text-foreground'
            )}>
              {value}
            </p>
            {subtitle && (
              <p className={cn(
                'text-sm mt-1',
                isHighlighted ? 'text-primary-foreground/80' : 'text-muted-foreground'
              )}>
                {subtitle}
              </p>
            )}
            {trend && (
              <div className="flex items-center mt-2">
                <span
                  className={cn(
                    'text-sm font-medium',
                    trend.isPositive 
                      ? 'text-green-500' 
                      : isHighlighted 
                        ? 'text-primary-foreground/70' 
                        : 'text-destructive'
                  )}
                >
                  {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
                </span>
                {!isHighlighted && (
                  <span className="text-xs text-muted-foreground ml-1">vs período anterior</span>
                )}
              </div>
            )}
          </div>
          {icon && (
            <div className={cn(
              'ml-4 text-4xl',
              isHighlighted ? 'text-primary-foreground' : 'text-muted-foreground'
            )}>
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

