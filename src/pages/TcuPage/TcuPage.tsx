import AnaliseTCU from '@/features/analise/ui/AnaliseTCU';

export default function TcuPage() {
  const handleIdClick = () => {};

  return (
    <div className="tab-page">
      <div className="tab-content">
        <AnaliseTCU onIdClick={handleIdClick} />
      </div>
    </div>
  );
}
