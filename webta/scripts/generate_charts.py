import matplotlib.pyplot as plt
import numpy as np
import seaborn as sns
import os

# --- KONFIGURASI GAYA VISUAL IEEE ---
# Menggunakan gaya whitegrid yang bersih dan font sans-serif yang standar untuk paper
plt.style.use('seaborn-v0_8-whitegrid')
plt.rcParams.update({
    'font.size': 12,
    'font.family': 'sans-serif',
    'axes.labelsize': 12,
    'axes.titlesize': 14,
    'xtick.labelsize': 10,
    'ytick.labelsize': 10,
    'legend.fontsize': 10,
    'figure.titlesize': 16
})

def plot_gas_comparison():
    """
    Grafik 1: Gas Consumption per Smart Contract Function
    Membandingkan biaya komputasi antar fungsi.
    """
    functions = ['ERC721 (Base)', 'Transfer', 'Update', 'Mint (WebKoi)']
    # Data berdasarkan hasil eksperimen riil Anda
    gas_values = [57141, 239041, 263623, 463104]
    
    plt.figure(figsize=(9, 6))
    colors = ['#bdc3c7', '#7f8c8d', '#34495e', '#e67e22'] # Warna kontras untuk sistem usulan (Oranye)
    bars = plt.bar(functions, gas_values, color=colors, edgecolor='black', linewidth=1)
    
    plt.ylabel('Gas Units (Used)')
    plt.title('Fig 1. Computational Cost Comparison')
    
    # Menambahkan label angka di atas setiap bar
    for bar in bars:
        yval = bar.get_height()
        plt.text(bar.get_x() + bar.get_width()/2, yval + 10000, f'{int(yval):,}', 
                 ha='center', va='bottom', fontweight='bold', color='#2c3e50')
    
    plt.grid(axis='y', linestyle='--', alpha=0.7)
    plt.tight_layout()
    plt.savefig('chart_gas_comparison.png', dpi=300)
    print("✅ Berhasil membuat: chart_gas_comparison.png")

def plot_stress_test():
    """
    Grafik 2: System Scalability (Time vs Batch Size)
    Membuktikan bahwa sistem stabil saat menerima beban tinggi.
    """
    batch_sizes = [10, 50, 100, 250, 500]
    # Waktu eksekusi total dalam detik (data dari stressTest.ts)
    execution_times = [0.21, 0.98, 2.10, 4.85, 9.97] 
    
    plt.figure(figsize=(9, 6))
    plt.plot(batch_sizes, execution_times, marker='o', markersize=8, 
             linestyle='-', color='#c0392b', linewidth=2.5, label='Hardhat Local Node')
    
    plt.xlabel('Number of Transactions (Batch Size)')
    plt.ylabel('Total Execution Time (Seconds)')
    plt.title('Fig 2. Transaction Throughput & Scalability')
    plt.legend(frameon=True, shadow=True)
    plt.grid(True, linestyle=':', alpha=0.6)
    
    # Menambahkan anotasi pada titik akhir
    plt.annotate(f'{execution_times[-1]}s', 
                 xy=(batch_sizes[-1], execution_times[-1]), 
                 xytext=(batch_sizes[-1]-50, execution_times[-1]+0.5),
                 arrowprops=dict(facecolor='black', shrink=0.05, width=1, headwidth=5))

    plt.tight_layout()
    plt.savefig('chart_scalability.png', dpi=300)
    print("✅ Berhasil membuat: chart_scalability.png")

def plot_latency_comparison():
    """
    Grafik 3: Latency Comparison (Local vs Public Network)
    Membandingkan responsivitas verifikasi QR.
    """
    labels = ['Read Latency (ms)', 'UI Load Time (ms)']
    local_data = [22.40, 60.00]
    sepolia_data = [336.31, 1130.00] 
    
    x = np.arange(len(labels))
    width = 0.35
    
    fig, ax = plt.subplots(figsize=(9, 6))
    rects1 = ax.bar(x - width/2, local_data, width, label='Local (Hardhat)', color='#3498db', edgecolor='black')
    rects2 = ax.bar(x + width/2, sepolia_data, width, label='Public (Sepolia)', color='#e74c3c', edgecolor='black')
    
    ax.set_ylabel('Response Time (ms)')
    ax.set_title('Fig 3. Network Latency Impact Analysis')
    ax.set_xticks(x)
    ax.set_xticklabels(labels)
    ax.legend()
    
    # Tambah label angka di atas bar grouped
    def autolabel(rects):
        for rect in rects:
            height = rect.get_height()
            ax.annotate(f'{height}',
                        xy=(rect.get_x() + rect.get_width() / 2, height),
                        xytext=(0, 3), 
                        textcoords="offset points",
                        ha='center', va='bottom', fontsize=9, fontweight='bold')

    autolabel(rects1)
    autolabel(rects2)
    
    plt.tight_layout()
    plt.savefig('chart_latency_comparison.png', dpi=300)
    print("✅ Berhasil membuat: chart_latency_comparison.png")

if __name__ == "__main__":
    print("🎨 Sedang menghasilkan grafik untuk Paper IEEE...")
    plot_gas_comparison()
    plot_stress_test()
    plot_latency_comparison()
    print("\n🚀 Selesai! Cek folder proyek Anda untuk melihat file .png hasil generate.")