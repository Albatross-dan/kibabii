import * as React from 'react';
import { LucideIcon, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface WelcomeActionCardProps {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
  className?: string;
}

export function WelcomeActionCard({
  id,
  title,
  description,
  icon,
  onClick,
  className = ''
}: WelcomeActionCardProps) {
  return (
    <Card
      id={id}
      onClick={onClick}
      className={`relative p-5 flex items-center justify-between border hover:border-primary bg-white rounded-2xl cursor-pointer group hover:shadow-lg transition-all ${className}`}
    >
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-all">
          {icon}
        </div>
        <div className="space-y-0.5">
          <h4 className="font-black text-sm text-foreground group-hover:text-primary transition-colors">
            {title}
          </h4>
          <p className="text-xs text-muted-foreground font-semibold">
            {description}
          </p>
        </div>
      </div>
      
      <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-all">
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
      </div>
    </Card>
  );
}
