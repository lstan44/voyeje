import React from 'react';
import IncidentCard from './IncidentCard';
import type { Incident } from '../types';

interface IncidentListProps {
  incidents: Incident[];
}

export default function IncidentList({ incidents }: IncidentListProps) {
  return (
    <div className="space-y-6">
      {incidents.map((incident) => (
        <IncidentCard key={incident.id} incident={incident} />
      ))}
    </div>
  );
}