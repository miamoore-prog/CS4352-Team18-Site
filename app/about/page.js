

"use client";

import React from "react";
import Link from "next/link";

export default function AboutPage() {
  



  return (
    //added the spacing betweed h1 and p and also increased the font size of h1
    <div className= "header">

      <h1 style = {{fontSize: "32px", lineHeight: "1.8"}}>About</h1>

      <p>Hi there! We are a team of five, Mia, Dallia, Uy, Nykaela, and William. We built this website for those 
        who want to learn more about new technologies and how they can be used in everyday life. From AI to simply new apps, we've got you convered! 
      </p>

      <Link href="/">
        <Button  className="px-4 py-2 bg-blue-500 text-white rounded">
          Home
        </Button>
      </Link>



    </div>
  );
};
