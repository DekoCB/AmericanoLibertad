import { QRCodeSVG } from 'qrcode.react';

export default function StudentQrCode({
    value,
    size = 200,
}: {
    value: string;
    size?: number;
}) {
    return (
        <div className="inline-flex flex-col items-center gap-3 rounded-2xl border border-brand-border bg-white p-4">
            <QRCodeSVG value={value} size={size} level="M" />
        </div>
    );
}
