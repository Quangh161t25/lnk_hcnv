import { DanhGiaList } from './DanhGiaList';

export default function DanhGiaThuViecPage() {
  return (
    <div className="flex flex-col h-page relative">
      <div className="flex-1 min-h-0 flex flex-col mt-1.5">
        <DanhGiaList />
      </div>
    </div>
  );
}
