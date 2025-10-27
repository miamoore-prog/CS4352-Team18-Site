// basic structure for about page
const aboutPage = document.createElement('div');
aboutPage.style.fontFamily = 'Arial, sans-serif';
aboutPage.style.padding = '20px';

// Title of page
const title = document.createElement('h1');
title.textContent = 'About Us';
title.style.color = '#333';
aboutPage.appendChild(title);

// description
const description = document.createElement('p');
description.textContent = 'Welcome to the About Page! Read more to discover excited to tell you guys about us.';
description.style.lineHeight = '1.6';
aboutPage.appendChild(description);

// More detail about team 18
const placeholder = document.createElement('p');
placeholder.textContent = 'We are a team of five (Dallia, Uy, Nykaela, Mia, and William), and we wanted to created a site for those struggling with new AI technology. Here can you search up any problems you have with AI, and we will recommend tools to help you with your needs.';
aboutPage.appendChild(placeholder);

// Append the About Page to the body
document.body.appendChild(aboutPage);