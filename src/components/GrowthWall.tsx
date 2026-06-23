import { Mascot } from './Mascot';

export function GrowthWall({
  heightCm,
  name,
}: {
  heightCm: number | null;
  name: string;
}) {
  return (
    <div
      className="relative mx-3 mt-2 overflow-hidden rounded-3xl p-3"
      style={{ background: 'linear-gradient(180deg,#FFEBC4,#FFF3DF 60%,#EAD3A6)', height: 232 }}
    >
      <div
        className="absolute right-4 top-2 h-7 w-7 rounded-full"
        style={{ background: '#FFD15C', boxShadow: '0 0 0 5px rgba(255,209,92,.35)' }}
      />
      <div
        className="absolute bottom-0 right-5 top-0 w-px"
        style={{ background: 'linear-gradient(#E8B27A,#F0D49E)' }}
      />
      <div className="absolute bottom-1.5" style={{ left: 16 }}>
        <Mascot size={130} />
      </div>
      {heightCm && (
        <div
          className="absolute right-3 top-3 max-w-[60%] rounded-xl bg-white px-3 py-1.5 text-xs font-extrabold shadow"
          style={{ color: 'var(--primary)' }}
        >
          {name}长高啦!<span className="text-sm">{heightCm}</span>cm
        </div>
      )}
    </div>
  );
}
