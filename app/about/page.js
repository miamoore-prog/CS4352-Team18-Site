"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";

const teamMemberStyle = {
  marginTop: "20px",
  marginBottom: "20px",
};

const teamMembers = [
  { src: "/Dallia.png", name: "Dallia" },
  { src: "/mia.png", name: "Mia" },
  { src: "/nykaela.png", name: "Nykaela" },
  { src: "/uy.png", name: "Uy" },
  { src: "/william.png", name: "William" },
];

export default function AboutPage() {
  return (
    <div className="header">
      <h1 style={{ fontSize: "32px", lineHeight: "1.8" }}>About</h1>

      <p>
        Hi there! We are a team of five, Mia, Dallia, Uy, Nykaela, and William.
        We built this website for those who want to learn more about new
        technologies and how they can be used in everyday life. From AI to
        simply new apps, we've got you covered!
      </p>

      <h2 style={{ fontSize: "32px", lineHeight: "1.8" }}>
        More about this AI Site
      </h2>
      <p>
        In this site, we have a collection of articles that cover a wide range
        of topics related to AI and new technologies. Anyone from all ages can
        understand more about the latest advancements in technology and how they
        can be used in everyday life. No one will be left out!
      </p>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: "20px",
          marginTop: "20px",
        }}
      >
        {teamMembers.map((member) => (
          <Image
            key={member.name}
            src={member.src}
            alt={`${member.name} - Team Member`}
            width={150}
            height={85}
            style={teamMemberStyle}
          />
        ))}
      </div>
    </div>
  );
}
