'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

export default function BackButton() {
    const router = useRouter();

    return (
        <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 bg-white text-gray-700 hover:text-gray-900 font-bold px-4 py-2.5 rounded-xl shadow-sm hover:shadow border border-gray-200 hover:border-gray-300 transition-all group mb-4"
        >
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            Kembali
        </button>
    );
}
