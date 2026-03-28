import React from 'react';
import logoImg from '../../assets/logo-removebg-preview.png';

export default function Logo({ className = "w-8 h-8" }) {
  return (
    <img 
      src={logoImg} 
      alt="FitNexus logo" 
      className={`object-contain brightness-110 contrast-110 dark:brightness-125 ${className}`}
    />
  );
}
