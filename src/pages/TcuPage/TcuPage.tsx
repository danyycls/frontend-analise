import { useState } from 'react';
import AnaliseTCU from '@/features/analise/ui/AnaliseTCU';
import { PopupInfo } from '@/shared/ui/EntityInfo/EntityInfo';

export default function TcuPage() {
  const handleIdClick = () => {};
  const [popupInfo, setPopupInfo] = useState<string | null>(null);

  return (
    <div className="tab-page">
      <div className="tab-content">
        <AnaliseTCU onIdClick={handleIdClick} onInfoClick={setPopupInfo} />
      </div>
      {popupInfo && <PopupInfo chave={popupInfo} onFechar={() => setPopupInfo(null)} />}
    </div>
  );
}
