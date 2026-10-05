import React, { useId } from "react";
// Original vector character illustrations; no network or image service required.
export default function Portrait({ character: c, className = "" }) {
  const uid = useId().replace(/:/g, "");
  const id = (n) => `${uid}${n}`;
  const short = c.index % 3 === 1;
  const pony = c.index % 4 === 0;
  const glasses = c.id === "mio" || c.id === "shiori";
  const hair = c.hair;
  const blonde = c.style === "blonde";
  const eye =
    c.style === "pink"
      ? "#ac597b"
      : c.style === "blue"
        ? "#518eaa"
        : c.style === "purple"
          ? "#8871b1"
          : "#82685b";
  return (
    <svg
      viewBox="0 0 360 470"
      className={`portrait ${className}`}
      role="img"
      aria-label={`${c.name}のイラスト`}
    >
      <defs>
        <linearGradient id={id("hair")} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor={blonde ? "#ead3a4" : hair} />
          <stop offset=".48" stopColor={hair} />
          <stop
            offset="1"
            stopColor={c.style === "pink" ? "#815970" : "#393446"}
          />
        </linearGradient>
        <linearGradient id={id("dress")} x2=".8" y2="1">
          <stop stopColor="#fffbf9" />
          <stop offset="1" stopColor={c.color} />
        </linearGradient>
        <radialGradient id={id("skin")}>
          <stop stopColor="#fff0e4" />
          <stop offset="1" stopColor="#f8d7cb" />
        </radialGradient>
        <radialGradient id={id("blush")}>
          <stop stopColor="#ed8e9b" stopOpacity=".5" />
          <stop offset="1" stopColor="#ed8e9b" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={id("eye")} x2="0" y2="1">
          <stop stopColor="#3c364b" />
          <stop offset=".55" stopColor={eye} />
          <stop offset="1" stopColor="#ddc9bf" />
        </linearGradient>
      </defs>
      {pony && (
        <>
          <path
            d="M108 128C12 104 39 266 5 322c64 8 126-74 95-153Z"
            fill={`url(#${id("hair")})`}
          />
          <path
            d="M255 125c99-24 55 143 101 215-62-5-110-80-100-159Z"
            fill={`url(#${id("hair")})`}
          />
          <path
            d="M64 188Q41 265 34 294M298 175q-4 95 35 139"
            fill="none"
            stroke={c.color}
            strokeOpacity=".5"
            strokeWidth="4"
          />
        </>
      )}
      <path
        d={
          short
            ? "M83 158C63 54 140 20 199 35c75-1 101 75 77 132l13 103c-29 33-66 36-111 21-57 25-102-1-103-37Z"
            : "M86 161C62 58 130 24 190 31c97-6 112 85 91 148 7 84 48 157 20 228-71 23-172 24-242-5 28-91 25-159 27-241Z"
        }
        fill={`url(#${id("hair")})`}
      />
      <path
        d="M145 246l-5 43 42 39 45-39-10-47"
        fill={`url(#${id("skin")})`}
        stroke="#e1b3a9"
        strokeWidth="1"
      />
      <path
        d="M146 251q34 27 71-2l3 20q-44 17-76-4"
        fill="#e5b6ae"
        opacity=".55"
      />
      <path
        d="M107 292C63 301 42 349 27 470h306c-17-105-28-166-79-178l-34-10-39 26-42-26Z"
        fill={`url(#${id("dress")})`}
        stroke="#b98795"
        strokeOpacity=".45"
      />
      <path
        d="M105 296 81 329l32 33-18 108M253 296l27 33-32 33 18 108"
        fill="none"
        stroke="#fff"
        strokeOpacity=".8"
        strokeWidth="7"
      />
      <path
        d="m139 282 43 26-24 49-47-60ZM220 282l-38 26 26 49 46-60Z"
        fill="#fffaf5"
        stroke={c.color}
        strokeWidth="2"
      />
      {c.rarity === "SSR" ? (
        <>
          <path
            d="m182 337-38-18-10 34 48-8 39 13 12-35Z"
            fill={c.color}
            stroke="#fff"
            strokeWidth="2"
          />
          <circle cx="182" cy="340" r="9" fill="#d6af64" />
          <path d="m177 344-14 60 19-12 13 14-6-63" fill={c.color} />
          <path
            d="M78 326q-25 24-33 58l53 18 19-66M279 326q24 23 34 58l-50 18-22-66"
            fill="#fff7f5"
          />
          <path
            d="M55 384q15 8 36 11M270 395l30-10"
            stroke="#d9b168"
            strokeWidth="5"
          />
        </>
      ) : (
        <>
          <path d="m180 307-15 36 16 61 18-61-17-36" fill={c.hair} />
          <path
            d="M186 420h49v-29h-49"
            fill="none"
            stroke={c.color}
            strokeWidth="3"
          />
        </>
      )}
      <ellipse cx="101" cy="181" rx="14" ry="23" fill="#f6cdbf" />
      <ellipse cx="258" cy="181" rx="14" ry="23" fill="#f6cdbf" />
      <path
        d="M105 130c3-60 145-66 150 0l-4 70c-6 32-42 70-70 73-28-3-69-39-74-72Z"
        fill={`url(#${id("skin")})`}
        stroke="#deafa7"
        strokeWidth="1"
      />
      <ellipse
        cx="127"
        cy="213"
        rx="29"
        ry="17"
        fill={`url(#${id("blush")})`}
      />
      <ellipse
        cx="233"
        cy="213"
        rx="29"
        ry="17"
        fill={`url(#${id("blush")})`}
      />
      <path
        d="M117 165q19-13 36-1M208 164q19-13 35 1"
        fill="none"
        stroke={hair}
        strokeWidth="3"
        strokeLinecap="round"
      />
      {[0, 1].map((side) => (
        <g key={side} transform={side ? "translate(361 0) scale(-1 1)" : ""}>
          <path d="M114 182q20-22 43 1-17 24-39 9Z" fill="#fffdf8" />
          <ellipse
            cx="137"
            cy="185"
            rx="13"
            ry="17"
            fill={`url(#${id("eye")})`}
          />
          <ellipse cx="138" cy="185" rx="5" ry="11" fill="#403546" />
          <ellipse cx="132" cy="177" rx="5" ry="6" fill="white" />
          <circle cx="143" cy="192" r="3" fill="#fff5e6" />
          <path
            d="M113 181q20-20 44 2m-38-6-7-5"
            fill="none"
            stroke="#54404c"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          <path
            d="M121 199q12 7 24 0"
            fill="none"
            stroke="#c59392"
            strokeWidth="1.5"
          />
        </g>
      ))}
      <path
        d="m181 196-3 14 5 1"
        fill="none"
        stroke="#d8a49e"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d={
          c.index % 3 === 0
            ? "M167 230q14 15 29-1-14 4-29 1Z"
            : "M171 234q10 5 20-1"
        }
        fill={c.index % 3 === 0 ? "#ca7f89" : "none"}
        stroke="#b97b82"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M91 157C73 76 119 42 171 40c82-14 113 44 96 119-18-1-31-41-33-61 2 30-9 59-29 65 9-20 7-41-1-57-2 28-30 51-51 54 9-19 9-36 6-50-7 28-39 62-56 66Z"
        fill={`url(#${id("hair")})`}
      />
      <path
        d="M115 96q13-31 48-35M179 58q44-4 62 41M110 119l14-19M212 84l7 16"
        fill="none"
        stroke={c.color}
        strokeOpacity=".48"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path
        d="M98 134c-10 53-1 99 26 126-14-43-8-75-14-110M253 132c19 55 2 102-18 127 9-40 12-63 8-96"
        fill={`url(#${id("hair")})`}
      />
      {pony && (
        <>
          <path
            d="m99 133-30-24-8 34 36-2-11 25 31-12Z"
            fill={c.color}
            stroke="#fff5ed"
            strokeWidth="2"
          />
          <path
            d="m263 133 30-24 8 34-36-2 11 25-31-12Z"
            fill={c.color}
            stroke="#fff5ed"
            strokeWidth="2"
          />
          <circle cx="104" cy="139" r="6" fill="#f9e6a5" />
          <circle cx="260" cy="139" r="6" fill="#f9e6a5" />
        </>
      )}
      {glasses && (
        <g fill="none" stroke="#8d626d" strokeWidth="2">
          <rect x="109" y="172" width="52" height="33" rx="12" />
          <rect x="200" y="172" width="52" height="33" rx="12" />
          <path d="M161 184q20-9 39 0" />
        </g>
      )}
      {!pony && (
        <>
          <path d="m241 136 14 5m-13 0 14 5" stroke="#e7c875" strokeWidth="3" />
          <path d="m261 207 5 9-5 10-5-10Z" fill="#ebc984" />
        </>
      )}
      <path
        d="M100 433q-12-53-27-48-14 6 1 46l-6 39h41Z"
        fill={`url(#${id("skin")})`}
      />
      <path
        d="M78 403q-13-37-5-39 8-3 19 28-9-31 0-32 8-1 14 28"
        fill={`url(#${id("skin")})`}
        stroke="#dda99f"
        strokeWidth="1.5"
      />
    </svg>
  );
}
