import Link from "next/link";

export default function AdminNotFound() {
  return (
    <div className="grid min-h-dvh place-items-center p-6 text-center">
      <div>
        <div className="text-[72px] font-bold tracking-[-0.05em] text-line-2">404</div>
        <h1 className="text-[22px] font-semibold">Sahifa topilmadi</h1>
        <Link href="/admin" className="btn btn-primary mt-6">
          Bosh panelga
        </Link>
      </div>
    </div>
  );
}
