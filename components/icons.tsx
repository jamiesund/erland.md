type IconProps = { className?: string };

export function CheckIcon({ className }: IconProps) {
  return (
    <svg className={className} width="14" height="14" viewBox="1 1.3 12 12" aria-hidden="true">
      <path
        d="M3.5 8.255L5.852 10.5L10.5 4.083"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CopyIcon({ className }: IconProps) {
  return (
    <svg className={className} width="14" height="14" viewBox="4 4 14 14" aria-hidden="true">
      <path
        d="M9.103 9.103V6.333C9.103 5.931 9.431 5.603 9.833 5.603H15.666C16.069 5.603 16.396 5.931 16.396 6.333V12.167C16.396 12.569 16.069 12.897 15.666 12.897H12.896M12.166 9.103H6.333C5.931 9.103 5.603 9.431 5.603 9.833V15.667C5.603 16.069 5.931 16.397 6.333 16.397H12.166C12.569 16.397 12.896 16.069 12.896 15.667V9.833C12.896 9.431 12.569 9.103 12.166 9.103Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CursorIcon({ className }: IconProps) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
      <path
        d="M12.157 3.775L7.254 0.944C7.097 0.852 6.902 0.852 6.745 0.944L1.841 3.775C1.709 3.851 1.627 3.993 1.627 4.145V9.855C1.627 10.007 1.709 10.149 1.841 10.226L6.745 13.057C6.903 13.149 7.097 13.149 7.255 13.057L12.158 10.226C12.291 10.149 12.372 10.007 12.372 9.855V4.145C12.372 3.993 12.291 3.851 12.158 3.775H12.157ZM11.849 4.375L7.116 12.575C7.084 12.629 7 12.607 7 12.542V7.174C7 7.067 6.943 6.967 6.849 6.913L2.2 4.229C2.145 4.197 2.167 4.112 2.231 4.112H11.698C11.833 4.112 11.917 4.259 11.85 4.375H11.849V4.375Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function ChatGptIcon({ className }: IconProps) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M5.467 1.275C6.519 0.992 7.589 1.278 8.354 1.939 9.349 1.748 10.42 2.037 11.192 2.808 11.963 3.58 12.25 4.649 12.063 5.643 12.722 6.41 13.007 7.48 12.725 8.533 12.442 9.587 11.66 10.37 10.705 10.704 10.37 11.66 9.587 12.442 8.535 12.725 7.481 13.007 6.41 12.722 5.644 12.061 4.65 12.25 3.58 11.963 2.809 11.192 2.039 10.419 1.748 9.35 1.939 8.354 1.278 7.589 0.992 6.518 1.275 5.466 1.558 4.413 2.339 3.628 3.295 3.294 3.629 2.339 4.413 1.558 5.467 1.275ZM7.571 7.858C7.256 7.858 7 8.114 7 8.43 7 8.745 7.256 9.001 7.571 9.001H9.289C9.603 9.001 9.86 8.745 9.86 8.43 9.86 8.113 9.603 7.858 9.289 7.858H7.571ZM5.489 5.275C5.327 5.005 4.975 4.918 4.704 5.079 4.433 5.243 4.347 5.593 4.508 5.864L5.189 7 4.508 8.136C4.346 8.407 4.433 8.757 4.704 8.92 4.975 9.083 5.327 8.995 5.489 8.725L6.347 7.294C6.456 7.114 6.456 6.886 6.347 6.705L5.489 5.275Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function ClaudeIcon({ className }: IconProps) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
      <path
        d="M3.457 8.925L5.751 7.637L5.790 7.525L5.751 7.462L5.639 7.462L5.256 7.440L3.944 7.402L2.807 7.357L1.705 7.297L1.428 7.237L1.168 6.895L1.194 6.726L1.428 6.569L1.761 6.598L2.500 6.646L3.607 6.726L4.410 6.769L5.600 6.895L5.790 6.895L5.817 6.819L5.751 6.769L5.700 6.726L4.556 5.947L3.315 5.129L2.666 4.655L2.314 4.417L2.136 4.193L2.058 3.703L2.379 3.353L2.807 3.381L2.915 3.409L3.350 3.745L4.278 4.459L5.488 5.353L5.666 5.498L5.737 5.450L5.746 5.412L5.666 5.282L5.007 4.093L4.305 2.880L3.990 2.379L3.907 2.079C3.878 1.953 3.858 1.853 3.858 1.726L4.222 1.231L4.423 1.169L4.907 1.231L5.110 1.407L5.412 2.095L5.900 3.181L6.656 4.654L6.875 5.089L6.995 5.495L7.039 5.619L7.116 5.619L7.116 5.547L7.179 4.717L7.293 3.700L7.406 2.387L7.444 2.021L7.626 1.575L7.991 1.337L8.274 1.475L8.507 1.808L8.476 2.023L8.337 2.921L8.064 4.333L7.888 5.278L7.991 5.278L8.107 5.159L8.588 4.527L9.391 3.521L9.744 3.124L10.158 2.682L10.424 2.472L10.927 2.472L11.295 3.022L11.130 3.591L10.612 4.246L10.185 4.799L9.570 5.625L9.185 6.288L9.223 6.339L9.314 6.333L10.702 6.038L11.452 5.901L12.347 5.747L12.751 5.936L12.796 6.126L12.636 6.519L11.678 6.755L10.556 6.979L8.885 7.375L8.863 7.390L8.888 7.421L9.642 7.492L9.963 7.511L10.752 7.511L12.220 7.620L12.604 7.874L12.834 8.183L12.796 8.420L12.205 8.718L11.407 8.532L9.547 8.085L8.910 7.930L8.820 7.930L8.820 7.982L9.352 8.502L10.326 9.380L11.547 10.513L11.607 10.794L11.452 11.014L11.285 10.993L10.214 10.185L9.800 9.821L8.863 9.037L8.803 9.037L8.803 9.119L9.017 9.433L10.158 11.146L10.217 11.669L10.135 11.841L9.839 11.946L9.514 11.886L8.847 10.952L8.159 9.896L7.602 8.953L7.534 8.992L7.207 12.519L7.054 12.697L6.700 12.831L6.405 12.607L6.248 12.244L6.405 11.529L6.593 10.591L6.747 9.849L6.886 8.925L6.969 8.617L6.962 8.599L6.895 8.606L6.198 9.564L5.137 10.997L4.298 11.893L4.098 11.973L3.749 11.793L3.780 11.472L3.976 11.183L5.137 9.709L5.837 8.794L6.288 8.267L6.286 8.187L6.258 8.187L3.176 10.188L2.626 10.259L2.391 10.039L2.420 9.676L2.532 9.555L3.458 8.921L3.457 8.925Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function ResetIcon({ className }: IconProps) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M6.75 3.25L3.75 6.25L6.75 9.25"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4.5 6.25H14.25C17.7018 6.25 20.5 9.04822 20.5 12.5C20.5 15.9518 17.7018 18.75 14.25 18.75H5.75"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function LinkedInIcon({ className }: IconProps) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M4.98 3.5C4.98 4.88 3.88 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1 4.98 2.12 4.98 3.5zM.5 8.5h4V24h-4V8.5zM8.5 8.5h3.8v2.1h.05c.53-1 1.84-2.1 3.79-2.1 4.05 0 4.8 2.67 4.8 6.14V24h-4v-7.65c0-1.82-.03-4.16-2.54-4.16-2.54 0-2.93 1.98-2.93 4.03V24h-4V8.5z"
        fill="currentColor"
      />
    </svg>
  );
}

export function TwitterIcon({ className }: IconProps) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M22 5.8c-.7.3-1.5.6-2.3.7.8-.5 1.5-1.3 1.8-2.2-.8.5-1.7.8-2.6 1-1.5-1.6-4.1-1.7-5.7-.2-1.1 1-1.5 2.5-1.1 3.9-3.2-.2-6.1-1.7-8-4.1-1 1.8-.5 4.1 1.2 5.2-.6 0-1.3-.2-1.8-.5 0 1.9 1.3 3.5 3.1 3.9-.6.1-1.1.2-1.7.1.5 1.6 2 2.7 3.7 2.8-1.7 1.3-3.8 1.9-5.9 1.7 1.8 1.1 3.9 1.8 6.1 1.8 7.4 0 11.5-6.2 11.2-11.6.8-.6 1.5-1.3 2-2.1z"
        fill="currentColor"
      />
    </svg>
  );
}

export function CloseIcon({ className }: IconProps) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6.25 6.25L17.75 17.75M17.75 6.25L6.25 17.75" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function ChevronIcon({ className }: IconProps) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M9.5 18.25L15.75 12L9.5 5.75"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function DotsIcon({ className }: IconProps) {
  return (
    <svg className={className} width="12" height="12" viewBox="4 4 12 12" aria-hidden="true">
      <rect x="5.781" y="9.063" width="1.875" height="1.875" rx="2" fill="currentColor" />
      <rect x="9.063" y="9.063" width="1.875" height="1.875" rx="2" fill="currentColor" />
      <rect x="12.344" y="9.063" width="1.875" height="1.875" rx="2" fill="currentColor" />
    </svg>
  );
}
