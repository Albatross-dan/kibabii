import * as React from 'react';
import { ArrowRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface AccountTypeCardProps {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  buttonText: string;
  onClick: () => void;
  className?: string;
  features?: string[];
}

export function AccountTypeCard({
  id,
  icon,
  title,
  description,
  buttonText,
  onClick,
  className = '',
  features = []
}: AccountTypeCardProps) {
  return (
    <Card 
      id={id}
      className={`relative flex flex-col justify-between overflow-hidden border-2 transition-all p-6 bg-white rounded-3xl group cursor-pointer hover:border-primary hover:shadow-2xl hover:-translate-y-1 ${className}`}
      onClick={onClick}
    >
      <div>
        <div className="mb-5 inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-muted group-hover:bg-primary/10 transition-colors">
          <div className="text-3xl text-primary transition-all group-hover:scale-110">
            {icon}
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-black tracking-tight text-foreground transition-colors group-hover:text-primary">
            {title}
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {description}
          </p>
        </div>

        {features.length > 0 && (
          <ul className="mt-6 space-y-2.5">
            {features.map((feature, idx) => (
              <li key={idx} className="flex items-center text-xs text-muted-foreground font-medium">
                <span className="mr-2 text-primary font-bold">✓</span>
                {feature}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-8 pt-4 border-t border-muted">
        <Button 
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
          className="w-full h-11 text-sm font-black justify-between bg-primary hover:bg-primary-hover text-white rounded-2xl group-hover:pr-5 transition-all"
        >
          <span>{buttonText}</span>
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Button>
      </div>
    </Card>
  );
}
