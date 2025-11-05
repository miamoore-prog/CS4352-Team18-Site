"use client";

import React from "react";
import { Card } from "./ui";

export default function CarouselCard({ tool }) {
  return (
    <Card className="flex flex-col items-center p-5 min-w-[240px] space-y-4 flex-shrink-0">
      <img src={tool.logo} alt={tool.name} className="logo w-16 h-16" />
      <h4 className="font-semibold text-center text-lg">{tool.name}</h4>
      <p className="text-sm text-slate-600 text-center leading-relaxed">{tool.about}</p>
    </Card>
  );
}

