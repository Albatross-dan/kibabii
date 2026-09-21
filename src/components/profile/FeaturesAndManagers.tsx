import * as React from 'react';
import { useState } from 'react';
import { 
  Home, 
  Plus, 
  Trash2, 
  MapPin, 
  Activity, 
  Wrench, 
  Star, 
  BarChart3, 
  Calendar, 
  Users, 
  PieChart,
  Grid
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

// SECTION 8: ACCOMMODATION MANAGEMENT COMPONENT
export function AccommodationManager() {
  const [accommodations, setAccommodations] = useState([
    { id: 'acc-1', name: 'Soweto Annex Block B - Room 12', price: 'KSh 4,500/month', location: 'Soweto Area, Kibabii', isFilled: false, views: 142 },
    { id: 'acc-2', name: 'Elite Quad Apartments - Block C', price: 'KSh 6,200/month', location: 'Gate A Extension', isFilled: true, views: 89 }
  ]);

  const handleToggleFilledStatus = (id: string, name: string) => {
    setAccommodations(prev => 
      prev.map(item => {
        if (item.id === id) {
          const toggled = !item.isFilled;
          toast.success(`Vacancy status for "${name}" marked as: ${toggled ? 'FILLED' : 'AVAILABLE'}.`);
          return { ...item, isFilled: toggled };
        }
        return item;
      })
    );
  };

  return (
    <div className="space-y-4 text-left">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div>
          <h4 className="font-extrabold text-slate-900 text-sm">Comrade Vacancy Board</h4>
          <p className="text-[10.5px] font-semibold text-slate-400">Manage hostel spaces, rental vacancies, and student roommate matchings.</p>
        </div>
        <div className="flex gap-1.5 shrink-0">
          <Button 
            size="xs" 
            onClick={() => toast.success('Accommodation Registration wizard launched.')}
            className="text-[11px] h-8 bg-sky-600 hover:bg-sky-700 font-extrabold rounded-lg text-white"
          >
            <Plus className="h-3.5 w-3.5" /> Add Vacancy
          </Button>
          <Button 
            size="xs" variant="outline"
            onClick={() => toast.info('Detailed accommodation performance load.')}
            className="text-[11px] h-8 rounded-lg"
          >
            <BarChart3 className="h-3.5 w-3.5" /> Vacancy Analytics
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {accommodations.map(acc => (
          <div key={acc.id} className="p-4 border rounded-2xl bg-white hover:border-slate-200 transition-all space-y-3 flex flex-col justify-between">
            <div className="space-y-1">
              <div className="flex justify-between items-start gap-4">
                <span className="text-[9px] uppercase font-black bg-sky-50 text-sky-700 px-2 py-0.5 rounded border border-sky-100">
                  Hostel Share
                </span>
                <span className={`text-[9px] uppercase font-black px-2 py-0.5 rounded ${
                  acc.isFilled ? 'bg-amber-100 text-amber-800' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                }`}>
                  {acc.isFilled ? 'Filled' : 'Vacancy Available'}
                </span>
              </div>
              <h5 className="font-black text-xs text-secondary leading-snug">{acc.name}</h5>
              <p className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" /> {acc.location}
              </p>
              <p className="text-xs font-black text-slate-800 block pt-0.5">{acc.price}</p>
            </div>

            <div className="flex justify-between items-center pt-2.5 border-t text-[11px] font-semibold text-slate-500">
              <span className="flex items-center gap-1 text-slate-400">
                <Activity className="h-3.5 w-3.5" /> Views: {acc.views}
              </span>
              <div className="flex gap-1.5">
                <Button 
                  size="xs" 
                  variant="outline" 
                  onClick={() => toast.info('Prompt: Edit Hostel Vacancy detail')}
                  className="h-7 text-[10px] font-bold rounded"
                >
                  Edit
                </Button>
                <Button 
                  size="xs" 
                  variant={acc.isFilled ? "outline" : "default"}
                  onClick={() => handleToggleFilledStatus(acc.id, acc.name)}
                  className={`h-7 text-[10px] font-bold rounded ${!acc.isFilled ? 'bg-sky-600 hover:bg-sky-700 text-white' : ''}`}
                >
                  {acc.isFilled ? 'Mark Vacant' : 'Mark Filled'}
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// SECTION 9: SERVICES MANAGEMENT COMPONENT
export function ServicesManager() {
  const [services, setServices] = useState([
    { id: 'srv-1', title: 'Laptop Software Repair, OS Flash & Antivirus', rating: '4.9', reviews: 18, price: 'KSh 400', views: 210 },
    { id: 'srv-2', title: 'Comrade Graphics Design (Flier, Thesis Bound)', rating: '4.8', reviews: 6, price: 'KSh 350', views: 84 }
  ]);

  return (
    <div className="space-y-4 text-left">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div>
          <h4 className="font-extrabold text-slate-900 text-sm">Services Provider Center</h4>
          <p className="text-[10.5px] font-semibold text-slate-400">Offer technical support, document compilation, tailoring, or laundry services to fellow students.</p>
        </div>
        <div className="flex gap-1.5 shrink-0">
          <Button 
            size="xs" 
            onClick={() => toast.success('Software Service addition triggered.')}
            className="text-[11px] h-8 bg-indigo-600 hover:bg-indigo-700 font-extrabold rounded-lg text-white"
          >
            <Plus className="h-3.5 w-3.5" /> Add Service
          </Button>
          <Button 
            size="xs" variant="outline"
            onClick={() => toast.info('Detailed service reviews dashboard.')}
            className="text-[11px] h-8 rounded-lg"
          >
            <Star className="h-3.5 w-3.5 text-amber-500" /> Service Reviews
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {services.map(srv => (
          <div key={srv.id} className="p-4 border rounded-2xl bg-white hover:border-slate-200 transition-all space-y-3 flex flex-col justify-between">
            <div className="space-y-1">
              <div className="flex justify-between items-start">
                <span className="text-[9px] uppercase font-black bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-150">
                  Tech & Services
                </span>
                <div className="flex items-center gap-1 text-[10.5px] text-amber-500 font-extrabold leading-none">
                  <Star className="h-3.5 w-3.5 fill-current" /> {srv.rating} <span className="text-slate-400 text-[10px]">({srv.reviews})</span>
                </div>
              </div>
              <h5 className="font-black text-xs text-secondary leading-snug">{srv.title}</h5>
              <p className="text-xs font-black text-slate-800 block pt-0.5">Rate: {srv.price}</p>
            </div>

            <div className="flex justify-between items-center pt-2.5 border-t text-[11px] font-semibold text-slate-500">
              <span className="flex items-center gap-1 text-slate-400">
                <Activity className="h-3.5 w-3.5" /> Performance: {srv.views} views
              </span>
              <Button 
                size="xs" 
                variant="outline" 
                onClick={() => toast.success('Prompt: Modify Software repair profile')}
                className="h-7 text-[10px] font-semibold rounded"
              >
                Customize service
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// SECTION 10: EVENTS MANAGEMENT COMPONENT
export function EventsManager() {
  const [events, setEvents] = useState([
    { id: 'evt-1', title: 'Comrade BBQ Fest, Music & Networking', date: 'June 28, 2026', location: 'Hall B Common Lounge', price: 'KSh 100/Ticket', registered: 114 },
    { id: 'evt-2', title: 'Kibabii Developers Hackathon 2026', date: 'July 14, 2026', location: 'Lab 4 Computer Science Block', price: 'Free', registered: 65 }
  ]);

  return (
    <div className="space-y-4 text-left">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div>
          <h4 className="font-extrabold text-slate-900 text-sm">Comrade Event Planner Desk</h4>
          <p className="text-[10.5px] font-semibold text-slate-400">Host, organize, ticket, and registers student attendees for events.</p>
        </div>
        <div className="flex gap-1.5 shrink-0">
          <Button 
            size="xs" 
            onClick={() => toast.success('Event Creator wizard launched.')}
            className="text-[11px] h-8 bg-purple-600 hover:bg-purple-700 font-extrabold rounded-lg text-white"
          >
            <Plus className="h-3.5 w-3.5" /> Create Event
          </Button>
          <Button 
            size="xs" variant="outline"
            onClick={() => toast.info('Roster list view applied.')}
            className="text-[11px] h-8 rounded-lg"
          >
            <Users className="h-3.5 w-3.5" /> Registrations
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {events.map(evt => (
          <div key={evt.id} className="p-4 border rounded-2xl bg-white hover:border-slate-200 transition-all space-y-3 flex flex-col justify-between">
            <div className="space-y-1">
              <span className="text-[9px] uppercase font-black bg-purple-50 text-purple-700 px-2 py-0.5 rounded border border-purple-100 block w-max">
                Event Ticket
              </span>
              <h5 className="font-black text-xs text-secondary leading-snug">{evt.title}</h5>
              <p className="text-[10.5px] text-slate-400 font-bold">{evt.date} • {evt.location}</p>
              <p className="text-xs font-black text-slate-800 block pt-0.5">{evt.price}</p>
            </div>

            <div className="flex justify-between items-center pt-2.5 border-t text-[11px] font-semibold text-slate-500">
              <span className="flex items-center gap-1.5 text-secondary font-bold">
                <Users className="h-4 w-4 text-slate-400" /> {evt.registered} Registered
              </span>
              <Button 
                size="xs" 
                variant="outline" 
                onClick={() => toast.success('Roster list emailed to coordinator.')}
                className="h-7 text-[10px] font-semibold rounded"
              >
                Manage list
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
