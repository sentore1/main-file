import { Bell } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from '@inertiajs/react';

interface LateCheckoutBadgeProps {
    count: number;
}

export default function LateCheckoutBadge({ count }: LateCheckoutBadgeProps) {
    if (count === 0) return null;

    return (
        <Link href="/room-bookings?filter=late">
            <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {count > 0 && (
                    <Badge 
                        variant="destructive" 
                        className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                    >
                        {count > 9 ? '9+' : count}
                    </Badge>
                )}
            </Button>
        </Link>
    );
}
