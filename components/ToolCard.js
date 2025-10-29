"use client";

import Image from "next/image";
import React from "react";
import { Card, Button } from "./ui";

export default function ToolCard({ tool, onOpen }) {
  return (
    <Card className="flex items-stretch gap-4 p-4 min-h-[260px]">
      <img src={tool.logo} alt={tool.name} className="w-16 h-16 object-contain" />{/*logo*/} 

      <div className="flex-1 flex flex-col justify-between">{/*info*/}
        <div className="flex items-start justify-between">
          <div>{/*name*/}
            <h4 className="font-semibold">{tool.name}</h4>
            <div className="text-sm text-slate-500">{tool.about}</div>
          </div>
          <div className="text-xs text-slate-400">{/*Top right tags*/}
            {tool.tags.slice(0, 2).join(" • ")}
          </div>
        </div>
        
        <p className="mt-3 text-sm text-slate-600">{tool.summary}</p>{/*summmary*/}

        <div className="mt-3 flex items-center">{/*Bottom tags*/}
          {tool.tags.map((tag) => (
            <span key={tag} className="tag">
              {tag}
            </span>
          ))}
        </div>

        <div className="flex items-center justify-between mt-auto">{/*Details button*/}
          <Button onClick={onOpen} variant="ghost" className="text-sm">
            View details
          </Button>
        </div>
      </div>
    </Card>
  );
}
