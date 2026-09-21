import * as React from 'react';
import { useState } from 'react';
import { Store, Star, Heart, ExternalLink } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

export default function FollowedStoresPanel() {
  const [followedStores, setFollowedStores] = useState([
    {
      id: 'store-1',
      name: 'Comrade Printing Cyber',
      category: 'Services',
      rating: '4.8',
      gradient: 'linear-gradient(135deg, #1e3c72, #2a5298)',
      isFollowed: true
    },
    {
      id: 'store-2',
      name: 'Hall 1 Snack & Diner',
      category: 'Food',
      rating: '4.9',
      gradient: 'linear-gradient(135deg, #f12711, #f5af19)',
      isFollowed: true
    },
    {
      id: 'store-3',
      name: 'Kibabii Tech Solutions',
      category: 'Electronics',
      rating: '4.7',
      gradient: 'linear-gradient(135deg, #0f2027, #203a43)',
      isFollowed: true
    },
    {
      id: 'store-4',
      name: 'Campus Fashion Hub',
      category: 'Apparel',
      rating: '4.6',
      gradient: 'linear-gradient(135deg, #833ab4, #fd1d1d)',
      isFollowed: true
    }
  ]);

  const handleToggleFollow = (id: string, name: string) => {
    setFollowedStores(prev => 
      prev.map(store => {
        if (store.id === id) {
          const toggledState = !store.isFollowed;
          toast.success(toggledState ? `Followed ${name}!` : `Unfollowed ${name}.`);
          return { ...store, isFollowed: toggledState };
        }
        return store;
      })
    );
  };

  const activeFollowed = followedStores.filter(s => s.isFollowed);

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center px-1">
        <h4 className="font-extrabold text-slate-900 text-sm">Followed Campus Stores ({activeFollowed.length})</h4>
        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest hidden sm:inline-block">Swipe / Scroll horizontally ↔</span>
      </div>

      {activeFollowed.length === 0 ? (
        <div className="p-8 text-center bg-slate-50 border rounded-2xl border-dashed border-slate-100">
          <p className="text-xs font-semibold text-slate-400">You do not follow any Kibabii campus stores. Search stores on home page to receive updates!</p>
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-3 snap-x scrollbar-thin scrollbar-thumb-slate-200">
          {followedStores.map(store => (
            <Card 
              key={store.id} 
              className={`min-w-[240px] sm:min-w-[270px] w-[240px] border border-slate-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all shrink-0 snap-start flex flex-col justify-between ${
                !store.isFollowed ? 'opacity-40 animate-pulse' : ''
              }`}
            >
              <div className="h-20 w-full relative" style={{ background: store.gradient }}>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <span className="absolute top-2 right-2 px-2 py-0.5 rounded text-[9px] font-black uppercase text-indigo-700 bg-indigo-50 border border-indigo-100 shadow">
                  {store.category}
                </span>
              </div>

              <CardContent className="p-4 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-1">
                  <h5 className="font-black text-xs text-secondary truncate">{store.name}</h5>
                  <div className="flex items-center gap-1.5 text-xs text-amber-500 font-extrabold">
                    <Star className="h-3 w-3 fill-current" /> {store.rating} / 5.0
                  </div>
                </div>

                <div className="flex gap-2 text-xs">
                  <Button 
                    variant={store.isFollowed ? 'secondary' : 'default'}
                    size="xs"
                    onClick={() => handleToggleFollow(store.id, store.name)}
                    className="flex-1 text-[11px] font-bold rounded-lg h-8"
                  >
                    {store.isFollowed ? 'Unfollow' : 'Follow'}
                  </Button>
                  <Button 
                    asChild 
                    variant="outline" 
                    size="xs"
                    className="text-[11px] font-bold rounded-lg h-8 px-2"
                  >
                    <Link to={`/profile/${store.name.toLowerCase().replace(/\s+/g, '_')}`}>
                      View <ExternalLink className="h-3 w-3 ml-1" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
