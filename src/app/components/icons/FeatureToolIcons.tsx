import type { SVGProps } from 'react';

function SplinePointerBase({ children, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M5 17A12 12 0 0 1 17 5" />
      <circle cx="19" cy="5" r="2" />
      <circle cx="5" cy="19" r="2" />
      {children}
    </svg>
  );
}

export function WeldFeatureIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <SplinePointerBase {...props}>
      <g transform="translate(11, 10.5) scale(0.6)">
        <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
      </g>
    </SplinePointerBase>
  );
}

export function GrindFeatureIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <SplinePointerBase {...props}>
      <g transform="translate(11, 10.5) scale(0.55)">
        <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
        <path d="M20 3v4" />
        <path d="M22 5h-4" />
        <path d="M4 17v2" />
        <path d="M5 18H3" />
      </g>
    </SplinePointerBase>
  );
}

export function AssemblyFeatureIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <SplinePointerBase {...props}>
      <g transform="translate(10, 10.5) scale(0.6)">
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="6" />
        <circle cx="12" cy="12" r="2" />
      </g>
    </SplinePointerBase>
  );
}
