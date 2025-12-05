"use client";

import { useRef, useEffect } from "react";
import CarouselCard from "./CarouselCard";

export default function EnhancedCarousel({ tools }) {
  const scrollRef = useRef(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  // Auto-scroll functionality
  useEffect(() => {
    if (!scrollRef.current) return;

    const scroll = () => {
      if (scrollRef.current) {
        const maxScroll = scrollRef.current.scrollWidth / 2;
        let newPosition = scrollRef.current.scrollLeft + 1;

        // Reset to start when reaching halfway (seamless loop)
        if (newPosition >= maxScroll) {
          scrollRef.current.scrollLeft = 0;
        } else {
          scrollRef.current.scrollLeft = newPosition;
        }
      }
    };

    const interval = setInterval(scroll, 30);
    return () => clearInterval(interval);
  }, []);

  const scrollToNext = () => {
    if (scrollRef.current) {
      const cardWidth = 240 + 20; // card width + gap
      scrollRef.current.scrollBy({ left: cardWidth, behavior: "smooth" });
    }
  };

  const scrollToPrev = () => {
    if (scrollRef.current) {
      const cardWidth = 240 + 20; // card width + gap
      scrollRef.current.scrollBy({ left: -cardWidth, behavior: "smooth" });
    }
  };

  // Drag functionality
  const handleMouseDown = (e) => {
    isDragging.current = true;
    startX.current = e.pageX - scrollRef.current.offsetLeft;
    scrollLeft.current = scrollRef.current.scrollLeft;
    scrollRef.current.style.cursor = "grabbing";
  };

  const handleMouseMove = (e) => {
    if (!isDragging.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX.current) * 2;
    scrollRef.current.scrollLeft = scrollLeft.current - walk;
  };

  const handleMouseUp = () => {
    isDragging.current = false;
    if (scrollRef.current) {
      scrollRef.current.style.cursor = "grab";
    }
  };

  const handleMouseLeave = () => {
    isDragging.current = false;
    if (scrollRef.current) {
      scrollRef.current.style.cursor = "grab";
    }
  };

  // Touch events for mobile swipe
  const handleTouchStart = (e) => {
    startX.current = e.touches[0].pageX;
    scrollLeft.current = scrollRef.current.scrollLeft;
  };

  const handleTouchMove = (e) => {
    const x = e.touches[0].pageX;
    const walk = (x - startX.current) * 2;
    scrollRef.current.scrollLeft = scrollLeft.current - walk;
  };

  return (
    <div className="relative group">
      {/* Previous Button */}
      <button
        onClick={scrollToPrev}
        className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white shadow-lg rounded-full p-3 transition-all opacity-0 group-hover:opacity-100"
        aria-label="Previous"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6 text-slate-700"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* Carousel Container */}
      <div
        ref={scrollRef}
        className="overflow-x-hidden cursor-grab active:cursor-grabbing"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
      >
        <div className="flex gap-5 w-max">
          {tools.map((tool) => (
            <CarouselCard key={`first-${tool.id}`} tool={tool} />
          ))}
          {tools.map((tool) => (
            <CarouselCard key={`second-${tool.id}`} tool={tool} />
          ))}
        </div>
      </div>

      {/* Next Button */}
      <button
        onClick={scrollToNext}
        className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white shadow-lg rounded-full p-3 transition-all opacity-0 group-hover:opacity-100"
        aria-label="Next"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6 text-slate-700"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>

    </div>
  );
}
