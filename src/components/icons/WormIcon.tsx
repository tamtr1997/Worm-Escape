import type { SVGProps } from 'react';

export function WormIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 50" {...props}>
      <path
        d="M 5,25 C 15,5 35,5 45,25 S 65,45 75,25 S 95,5 95,5"
        fill="none"
        stroke="currentColor"
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="90" cy="10" r="3" fill="black" />
    </svg>
  );
}
