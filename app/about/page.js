

"use client";

import React from "react";
import Link from "next/link";
import Image from 'next/image';

export default function AboutPage() {
  



  return (
    //added the spacing betweed h1 and p and also increased the font size of h1
    <div className= "header">

      <h1 style = {{fontSize: "32px", lineHeight: "1.8"}}>About</h1>

      <p>Hi there! We are a team of five, Mia, Dallia, Uy, Nykaela, and William. We built this website for those 
        who want to learn more about new technologies and how they can be used in everyday life. From AI to simply new apps, we've got you convered! 
      </p>
      

  {/*below is the team images*/}
<div   style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px', marginTop: '20px' }}    >
      <Image
        src="/Dallia.png" // Replace with the actual image path in the public folder
        alt="About Page Image"
        width={150} // Adjust width as needed
        height={85} // Adjust height as needed
        style={{ marginTop: '20px', marginBottom: '20px' }}

      />

      <Image
       src="/mia.png"
       alt="About Page Image"
       width={150} // Adjust width as needed
       height={85} // Adjust height as needed
       style={{ marginTop: '20px', marginBottom: '20px' }}
      />

      <Image
      src = "/nykaela.png"
      alt = "About Page Image"
      width={150} // Adjust width as needed
      height={85} // Adjust height as needed
      style={{ marginTop: '20px', marginBottom: '20px' }}
      />

      <Image
      src = "/uy.png"
      alt = "About Page Image"
      width={150} // Adjust width as needed
      height={85} // Adjust height as needed
      style={{ marginTop: '20px', marginBottom: '20px' }}
      />

      <Image
      src="/william.png"
      alt="About Page Image"
      width={150} // Adjust width as needed
      height={85} // Adjust height as needed
      style={{ marginTop: '20px', marginBottom: '20px' }}
      />
      
      </div>



 {/* Home Button */}
 <Link href="/">
        <h1 style = {{lineHeight: "1.8"}}> </h1>
        <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600" style={{lineHeight: "1.8"}}>
          Home
        </button>
      </Link>





    </div>



    //</div>
  );
};
