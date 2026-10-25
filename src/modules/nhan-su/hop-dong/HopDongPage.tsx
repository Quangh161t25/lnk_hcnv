import { HopDongList } from './HopDongList';

export default function HopDongPage() {
  return (
    <div className="flex flex-col h-page relative">
      <div className="flex-1 min-h-0 flex flex-col mt-1.5">
        <HopDongList />
      </div>
    </div>
  );
}
