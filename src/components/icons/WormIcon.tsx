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

// import React, { SVGProps } from 'react';

// export function WormIcon(props: SVGProps<SVGSVGElement>) {
//   return (
//     <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 200" {...props}>
//       {/* Nền xanh nhạt, giống hình mẫu */}
//       <rect x="0" y="0" width="400" height="200" fill="#d1eefc" />

//       {/* Các chấm nhỏ gợi ý đường đi */}
//       <path
//         d="M 50,150 C 100,140 150,140 200,150"
//         fill="none"
//         stroke="#fdd835"
//         strokeWidth="2"
//         strokeDasharray="2 8"
//         opacity="0.6"
//       />

//       {/* Con sâu */}
//       <g id="caterpillar" stroke="black" strokeWidth="2.5">
//         {/* Đuôi */}
//         <circle cx="60" cy="145" r="18" fill="#aed581" />
//         <circle cx="60" cy="145" r="18" fill="url(#grad1)" /> {/* Gradient cho hiệu ứng 3D */}

//         {/* Đốt giữa 1 */}
//         <circle cx="95" cy="140" r="20" fill="#8bc34a" />
//         <circle cx="95" cy="140" r="20" fill="url(#grad2)" />

//         {/* Đốt giữa 2 */}
//         <circle cx="130" cy="135" r="22" fill="#aed581" />
//         <circle cx="130" cy="135" r="22" fill="url(#grad1)" />

//         {/* Đốt giữa 3 */}
//         <circle cx="165" cy="130" r="24" fill="#8bc34a" />
//         <circle cx="165" cy="130" r="24" fill="url(#grad2)" />
        
//         {/* Đầu */}
//         <circle cx="205" cy="120" r="28" fill="#aed581" />
//         <circle cx="205" cy="120" r="28" fill="url(#grad1)" />

//         {/* Các đốm trên thân (thay đổi vị trí để phù hợp hình dáng mới) */}
//         <g fill="#689f38" stroke="none" opacity="0.7">
//           <circle cx="95" cy="132" r="3" />
//           <circle cx="130" cy="127" r="3.5" />
//           <circle cx="165" cy="122" r="4" />
//         </g>

//         {/* Khuôn mặt */}
//         <g transform="translate(205, 120)">
//           {/* Mắt */}
//           <circle cx="-10" cy="-8" r="5" fill="black" stroke="none" />
//           <circle cx="10" cy="-8" r="5" fill="black" stroke="none" />
//           <circle cx="-9" cy="-9" r="2" fill="white" stroke="none" />
//           <circle cx="11" cy="-9" r="2" fill="white" stroke="none" />

//           {/* Miệng cười */}
//           <path d="M -7,8 Q 0,15 7,8" fill="none" strokeWidth="2.5" strokeLinecap="round" />

//           {/* Râu anten */}
//           <g strokeWidth="2" strokeLinecap="round">
//             <line x1="-8" y1="-25" x2="-15" y2="-40" />
//             <line x1="8" y1="-25" x2="15" y2="-40" />
//             <circle cx="-15" cy="-40" r="4" fill="#fdd835" />
//             <circle cx="15" cy="-40" r="4" fill="#fdd835" />
//           </g>
//         </g>

//         {/* Chân giả (Prolegs) */}
//         <g fill="#6d4c41" stroke="black" strokeWidth="1.5">
//           <path d="M 85,155 C 80,165 90,165 95,155" />
//           <path d="M 120,150 C 115,160 125,160 130,150" />
//           <path d="M 155,145 C 150,155 160,155 165,145" />
//           <path d="M 190,135 C 185,145 195,145 200,135" />
//         </g>
//       </g>

//       {/* Định nghĩa gradient để tạo hiệu ứng 3D nhẹ cho các đốt thân */}
//       <defs>
//         <radialGradient id="grad1" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
//           <stop offset="0%" style={{ stopColor: "#c5e89d", stopOpacity: 1 }} />
//           <stop offset="100%" style={{ stopColor: "#aed581", stopOpacity: 1 }} />
//         </radialGradient>
//         <radialGradient id="grad2" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
//           <stop offset="0%" style={{ stopColor: "#a9d666", stopOpacity: 1 }} />
//           <stop offset="100%" style={{ stopColor: "#8bc34a", stopOpacity: 1 }} />
//         </radialGradient>
//       </defs>
//     </svg>
//   );
// }