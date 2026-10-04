import { useId } from 'react';

export function ObjectArt({ kind, className }: { kind: string; className?: string }) {
  const id = useId().replace(/:/g, '');
  const paint = (name: string) => `url(#${id}-${name})`;
  const art = (() => {
    switch (kind) {
      case 'tea':
        return <>
          <ellipse cx="117" cy="155" rx="69" ry="26" fill={paint('wood')} />
          <ellipse cx="117" cy="151" rx="66" ry="23" fill="#bda17b" />
          <ellipse cx="117" cy="151" rx="52" ry="17" fill="none" stroke="#937a58" strokeWidth="1.5" />
          <path d="M157 99c36-9 41 39 13 48l-19-5 4-11c18 3 26-20 9-19l-11 1z" fill={paint('jade')} />
          <path d="M71 97h94l-9 45c-6 27-70 27-77 0z" fill={paint('jade')} />
          <ellipse cx="118" cy="97" rx="47" ry="18" fill="#b7cfc0" />
          <ellipse cx="118" cy="98" rx="39" ry="13" fill="#52614a" />
          <ellipse cx="118" cy="97" rx="34" ry="10" fill="#8f9054" />
          <path d="M87 119l4 19c2 6 8 10 13 12" fill="none" stroke="#c4dacf" strokeWidth="4" strokeLinecap="round" opacity=".7" />
        </>;
      case 'lantern':
        return <>
          <path d="M120 30v20" stroke="#715333" strokeWidth="3" />
          <path d="M98 53q22-9 44 0l-2 10H100z" fill={paint('gold')} />
          <path d="M99 60c-48 18-49 82 4 104h34c53-22 52-86 3-104z" fill={paint('red')} />
          <path d="M108 62c-28 24-28 73 0 101M120 61v103M132 62c28 24 28 73 0 101" stroke="#8f392b" strokeWidth="2" fill="none" opacity=".5" />
          <path d="M79 86q41 17 82 0M70 111q50 18 100 0M79 140q41 17 82 0" stroke="#e9b478" strokeWidth="1.5" fill="none" opacity=".55" />
          <path d="M103 161h34v9h-34z" fill={paint('gold')} />
          <path d="M120 170v24m-6-13v20m12-20v20" stroke="#b85135" strokeWidth="3" strokeLinecap="round" />
          <path d="M84 87c-7 11-8 24-5 36" stroke="#f9b68b" strokeWidth="4" fill="none" strokeLinecap="round" opacity=".7" />
        </>;
      case 'ticket':
        return <g transform="rotate(-14 120 115)">
          <path d="M47 65h146v97H47v-25c12 0 12-16 0-16zm146 56c-12 0-12 16 0 16" fill="#b59876" transform="translate(0 5)" />
          <path d="M47 65h146v97H47v-25c12 0 12-16 0-16zm146 56c-12 0-12 16 0 16" fill={paint('paper')} />
          <path d="M158 68v91" stroke="#b5a691" strokeWidth="1.5" strokeDasharray="3 4" />
          <rect x="60" y="77" width="87" height="19" rx="2" fill="#3a6152" />
          <path d="M69 86h39m-39 23h46m-46 7h60" stroke="#aebaa5" strokeWidth="3" />
          <path d="M64 134h68m-68 7h43" stroke="#a89982" strokeWidth="2" />
          <path d="M167 80v53m4-53v53m4-53v53m5-53v53m4-53v53" stroke="#655849" strokeWidth="1.5" />
          <circle cx="139" cy="140" r="13" stroke="#ad583e" strokeWidth="2" fill="none" opacity=".65" />
          <path d="M132 141l5 4 9-11" stroke="#ad583e" strokeWidth="2" fill="none" opacity=".65" />
        </g>;
      case 'umbrella':
        return <g transform="rotate(-18 120 110)">
          <path d="M120 61v108c0 24 29 23 29 5" fill="none" stroke="#a07d48" strokeWidth="5" strokeLinecap="round" />
          <path d="M120 40c-42 1-74 29-81 66 14-15 28-15 42 0 14-15 27-15 39 0 13-15 26-15 40 0 14-15 28-15 42 0-7-37-39-65-82-66z" fill={paint('jade')} />
          <path d="M120 40c-24 11-34 34-39 66m39-66c24 11 35 34 40 66m-40-66v66" fill="none" stroke="#355849" strokeWidth="1.5" />
          <path d="M120 40c-42 1-74 29-81 66 14-15 28-15 42 0 14-15 27-15 39 0 13-15 26-15 40 0 14-15 28-15 42 0" fill="none" stroke="#6d8a72" strokeWidth="2" />
          <path d="M120 32v8" stroke="#8b714a" strokeWidth="3" strokeLinecap="round" />
        </g>;
      case 'camera':
        return <g transform="rotate(-9 120 115)">
          <path d="M51 83l13-14h119l12 14v76H51z" fill="#363b32" />
          <rect x="49" y="81" width="146" height="79" rx="11" fill={paint('dark')} />
          <path d="M49 105h146v37H49z" fill="#45564b" />
          <rect x="61" y="88" width="27" height="11" rx="3" fill="#d7c29b" />
          <rect x="158" y="89" width="23" height="10" rx="2" fill="#929b8d" />
          <rect x="69" y="66" width="23" height="8" rx="3" fill="#ad8e59" />
          <circle cx="128" cy="120" r="34" fill="#202b27" stroke="#aaad96" strokeWidth="3" />
          <circle cx="128" cy="120" r="27" fill="#172725" stroke="#5e7264" strokeWidth="3" />
          <circle cx="128" cy="120" r="19" fill={paint('glass')} />
          <ellipse cx="120" cy="114" rx="7" ry="5" fill="#afc7b5" opacity=".6" />
          <circle cx="183" cy="151" r="3" fill="#b75137" />
          <path d="M51 97v42m144-41v39" stroke="#111f1a" strokeWidth="2" />
        </g>;
      case 'book':
        return <g transform="rotate(13 120 115)">
          <path d="M74 47h104v125l-13 14H63V60z" fill="#293f36" />
          <path d="M68 66h101v111H68z" fill="#d3c4a5" />
          <path d="M75 71h93m-93 6h93m-93 95h93" stroke="#b4a68e" />
          <path d="M64 51h103v120H64q-9 0-9 8V61q0-10 9-10z" fill={paint('jade')} />
          <path d="M69 51v120" stroke="#233e32" strokeWidth="2" />
          <rect x="85" y="74" width="61" height="65" fill="#e6dbc4" />
          <path d="M91 126l17-31 15 16 12-24 6 39z" fill="#74876b" />
          <circle cx="103" cy="88" r="7" fill="#bd7654" />
          <path d="M96 150h41m-32 6h23" stroke="#becca9" strokeWidth="2" />
          <path d="M156 177v19l-6-5-6 5v-19" fill="#b9563b" />
        </g>;
      case 'charm':
        return <g transform="rotate(9 120 115)">
          <path d="M120 62c-34-24-18-55 0-31 18-24 34 7 0 31z" fill="none" stroke="#b29967" strokeWidth="3" />
          <path d="M104 63h32l22 22v82q-38 17-76 0V85z" fill={paint('red')} />
          <path d="M89 89l18-18h25l18 18v71q-30 12-61 0z" fill="none" stroke="#d5b478" strokeWidth="1.5" />
          <path d="M101 70q19 11 38 0" stroke="#d7bf89" strokeWidth="3" fill="none" />
          <path d="M105 116q15-20 30 0-15 23-30 0zM120 98v37m-11-27h22m-22 20h22" fill="none" stroke="#e2c993" strokeWidth="2" strokeLinecap="round" />
          <path d="M113 150h14" stroke="#deb97e" strokeWidth="2" />
          <path d="M91 91v61" stroke="#e6a382" strokeWidth="3" opacity=".45" />
        </g>;
      case 'noodles':
        return <>
          <path d="M57 112h126l-13 43c-13 35-87 35-101 0z" fill={paint('paper')} />
          <ellipse cx="120" cy="111" rx="64" ry="24" fill="#cbc1a3" />
          <ellipse cx="120" cy="109" rx="57" ry="19" fill="#986b37" />
          <path d="M75 108q24-25 45 2t44-5m-82 9q20-23 43-2t29-10m-68 17q18-24 32-12t26 10m-46-19q24-14 42 1" stroke="#eacb82" strokeWidth="4" fill="none" strokeLinecap="round" />
          <ellipse cx="94" cy="101" rx="12" ry="7" fill="#74916b" transform="rotate(-20 94 101)" />
          <ellipse cx="147" cy="115" rx="10" ry="6" fill="#bd6042" />
          <path d="M168 56l-52 64m65-59l-56 62" stroke="#705638" strokeWidth="4" strokeLinecap="round" />
          <path d="M87 141q33 15 66 0" stroke="#c2ae83" strokeWidth="2" fill="none" />
          <path d="M93 76q-10-11 0-22m23 20q-9-11 0-24" stroke="#b5b1a1" strokeWidth="2" fill="none" opacity=".5" strokeLinecap="round" />
        </>;
      case 'rain':
        return <>
          <path d="M120 36c-9 32-52 66-52 100a52 52 0 0 0 104 0c0-34-43-68-52-100z" fill={paint('glass')} stroke="#9bbaaa" strokeWidth="1" />
          <path d="M119 45c-10 32-43 63-43 91 0 24 18 43 42 45" stroke="#dce5cd" strokeWidth="3" opacity=".7" fill="none" />
          <path d="M96 105c-12 15-16 26-14 39" stroke="#edf1df" strokeWidth="6" strokeLinecap="round" fill="none" opacity=".6" />
          <ellipse cx="138" cy="149" rx="15" ry="21" fill="#bed6c5" opacity=".25" />
        </>;
      case 'mountain':
        return <>
          <path d="M54 143l49-84 32 42 21-29 38 74-72 36z" fill={paint('jade')} />
          <path d="M54 143l49-84-6 82 25 41z" fill="#8ba58d" />
          <path d="M103 59l32 42-14 14-24 26z" fill="#adc1a6" />
          <path d="M121 115l35-43-8 72-26 38z" fill="#718f75" />
          <path d="M156 72l38 74-46-2z" fill="#b6c8a9" />
          <path d="M54 143l68 39 72-36v13l-72 33-68-38z" fill="#435d4b" />
          <path d="M83 96l20-37 15 20-15-5-10 20z" fill="#e2e6cf" opacity=".85" />
          <path d="M151 79l5-7 10 19-10-5z" fill="#edf0df" />
        </>;
      case 'record':
        return <g transform="rotate(-11 120 115)">
          <rect x="53" y="58" width="115" height="125" rx="2" fill="#b68760" />
          <rect x="53" y="58" width="115" height="118" rx="2" fill={paint('paper')} />
          <rect x="64" y="70" width="93" height="81" fill="#728a74" />
          <path d="M64 131q23-45 46-20t47-20v60H64z" fill="#b6be94" />
          <circle cx="89" cy="91" r="11" fill="#ddac71" />
          <path d="M67 161h54m-54 5h33" stroke="#95836b" strokeWidth="2" />
          <ellipse cx="154" cy="122" rx="52" ry="54" fill={paint('dark')} />
          <ellipse cx="154" cy="122" rx="43" ry="45" fill="none" stroke="#637265" strokeWidth="1" />
          <ellipse cx="154" cy="122" rx="35" ry="36" fill="none" stroke="#637265" strokeWidth="1" />
          <ellipse cx="154" cy="122" rx="21" ry="22" fill="#c37856" />
          <ellipse cx="154" cy="122" rx="4" ry="4" fill="#ece3cb" />
          <path d="M121 93q18-17 35-17" stroke="#a9b0a0" strokeWidth="3" strokeLinecap="round" opacity=".35" fill="none" />
        </g>;
      case 'bicycle':
        return <>
          <circle cx="65" cy="145" r="36" fill="#efead7" fillOpacity=".3" stroke="#415349" strokeWidth="6" />
          <circle cx="174" cy="145" r="36" fill="#efead7" fillOpacity=".3" stroke="#415349" strokeWidth="6" />
          <path d="M65 109v72m-36-36h72m73-36v72m-36-36h72m-160-25l51 51m0-51l-51 51m109-51l51 51m0-51l-51 51" stroke="#a9afa0" strokeWidth="1" />
          <path d="M65 145l35-52 25 52H65l43-38h48l-31 38m31-38l18 38" fill="none" stroke="#b86f46" strokeWidth="5" strokeLinejoin="round" />
          <path d="M109 108L97 82m59 26l-10-31h16" fill="none" stroke="#425449" strokeWidth="4" strokeLinecap="round" />
          <path d="M86 81h24m35-5l-8-8h21" stroke="#31443a" strokeWidth="5" strokeLinecap="round" fill="none" />
          <circle cx="125" cy="145" r="7" fill="#6c795e" />
          <path d="M125 145l10 14h8" stroke="#445548" strokeWidth="3" fill="none" />
          <path d="M41 108q24-20 46 0m66 0q22-17 43 0" fill="none" stroke="#b2996c" strokeWidth="3" />
        </>;
      default:
        return <ellipse cx="120" cy="115" rx="40" ry="50" fill={paint('jade')} />;
    }
  })();

  return (
    <svg className={className ?? "object-art"} viewBox="0 0 240 220" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`${id}-jade`} x1="69" y1="65" x2="164" y2="165" gradientUnits="userSpaceOnUse"><stop stopColor="#9db49a" /><stop offset=".45" stopColor="#6f927e" /><stop offset="1" stopColor="#3d6251" /></linearGradient>
        <linearGradient id={`${id}-red`} x1="77" y1="62" x2="161" y2="169" gradientUnits="userSpaceOnUse"><stop stopColor="#d9875d" /><stop offset=".45" stopColor="#bd5d3f" /><stop offset="1" stopColor="#863b2c" /></linearGradient>
        <linearGradient id={`${id}-paper`} x1="70" y1="65" x2="164" y2="172" gradientUnits="userSpaceOnUse"><stop stopColor="#f5ecd4" /><stop offset="1" stopColor="#d9c9a8" /></linearGradient>
        <linearGradient id={`${id}-wood`} x1="63" y1="137" x2="165" y2="179" gradientUnits="userSpaceOnUse"><stop stopColor="#b79c72" /><stop offset="1" stopColor="#806445" /></linearGradient>
        <linearGradient id={`${id}-gold`} x1="100" y1="55" x2="141" y2="175" gradientUnits="userSpaceOnUse"><stop stopColor="#d6ba7a" /><stop offset="1" stopColor="#8d713d" /></linearGradient>
        <linearGradient id={`${id}-dark`} x1="76" y1="74" x2="186" y2="156" gradientUnits="userSpaceOnUse"><stop stopColor="#5b6755" /><stop offset="1" stopColor="#26392f" /></linearGradient>
        <linearGradient id={`${id}-glass`} x1="82" y1="81" x2="164" y2="161" gradientUnits="userSpaceOnUse"><stop stopColor="#d1e1ce" stopOpacity=".9" /><stop offset=".4" stopColor="#82af9d" stopOpacity=".75" /><stop offset="1" stopColor="#3e7165" stopOpacity=".95" /></linearGradient>
        <filter id={`${id}-shadow`} x="-50%" y="-200%" width="200%" height="500%"><feGaussianBlur stdDeviation="7" /></filter>
      </defs>
      <ellipse cx="124" cy="187" rx={kind === 'bicycle' ? 82 : 59} ry="10" fill="#55462e" opacity=".14" filter={paint('shadow')} />
      {art}
    </svg>
  );
}
