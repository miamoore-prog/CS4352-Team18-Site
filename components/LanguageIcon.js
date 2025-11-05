"use client";

import React, { useState } from 'react';
import { Globe } from 'lucide-react';
import { Button } from './ui';

export default function LanguageIcon() {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Button
      variant="ghost"
      className={`p-2 rounded-full transition-all ${
        isHovered ? 'bg-slate-100' : ''
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      aria-label="Change Language"
      title="Change Language"
    >
      <Globe 
        size={24}
        className={`transition-colors ${
          isHovered ? 'text-primary' : 'text-slate-600'
        }`}
      />
    </Button>
  );
}