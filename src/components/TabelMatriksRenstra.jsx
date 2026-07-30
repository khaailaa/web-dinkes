
export default function TabelMatriksRenstra({ programs = [], kegiatan = [], subKegiatan = [] }) {
  // Format currency matching screenshot e.g. 22,653,100.00
  const formatAnggaranMatriks = (val) => {
    if (!val && val !== 0) return '0.00';
    return Number(val).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Build matrix rows structure
  const matrixRows = [];

  programs.forEach((prog, pIdx) => {
    // Find all kegiatan for this program
    const progKegList = kegiatan.filter(
      k => String(k.programId) === String(prog.id) || String(k.programId) === String(prog.raw?.id)
    );

    const kegBlocks = [];
    let progTotalSubRows = 0;

    if (progKegList.length === 0) {
      // Program with no kegiatan
      kegBlocks.push({
        keg: null,
        subList: [null],
        kegSubRowCount: 1,
      });
      progTotalSubRows = 1;
    } else {
      progKegList.forEach((keg) => {
        const kegSubList = subKegiatan.filter(
          sk => String(sk.kegiatanId) === String(keg.id) || String(sk.kegiatanId) === String(keg.raw?.id)
        );

        if (kegSubList.length === 0) {
          kegBlocks.push({
            keg,
            subList: [null],
            kegSubRowCount: 1,
          });
          progTotalSubRows += 1;
        } else {
          kegBlocks.push({
            keg,
            subList: kegSubList,
            kegSubRowCount: kegSubList.length,
          });
          progTotalSubRows += kegSubList.length;
        }
      });
    }

    // Now flatten into rows for table rendering
    let isFirstRowOfProgram = true;

    kegBlocks.forEach((kBlock) => {
      let isFirstRowOfKegiatan = true;

      kBlock.subList.forEach((sub) => {
        matrixRows.push({
          program: prog,
          kegiatan: kBlock.keg,
          subKegiatan: sub,
          isFirstRowOfProgram,
          progRowSpan: progTotalSubRows,
          isFirstRowOfKegiatan,
          kegRowSpan: kBlock.kegSubRowCount,
          nodeCode: sub?.kode || kBlock.keg?.kode || prog.kode || `${pIdx + 1}`,
        });

        isFirstRowOfProgram = false;
        isFirstRowOfKegiatan = false;
      });
    });
  });

  return (
    <div className="data-table-wrapper" style={{ overflowX: 'auto', border: '1px solid #cbd5e1', borderRadius: '4px' }}>
      <table className="data-table matrix-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', background: '#fff' }}>
        <thead>
          <tr style={{ background: '#f8fafc', borderBottom: '2px solid #cbd5e1' }}>
            <th style={thStyle}>Node</th>
            <th style={thStyle}>Program</th>
            <th style={thStyle}>Sasaran</th>
            <th style={thStyle}>Indikator</th>
            <th style={thStyle}>Target</th>
            <th style={thStyle}>Kegiatan</th>
            <th style={thStyle}>Sasaran</th>
            <th style={thStyle}>Indikator</th>
            <th style={thStyle}>Target</th>
            <th style={thStyle}>Sub Kegiatan</th>
            <th style={thStyle}>Sasaran</th>
            <th style={thStyle}>Indikator</th>
            <th style={thStyle}>Target</th>
            <th style={{ ...thStyle, textAlign: 'right' }}>Anggaran</th>
          </tr>
        </thead>
        <tbody>
          {matrixRows.length === 0 ? (
            <tr>
              <td colSpan={14} style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                Belum ada data Matriks Renstra
              </td>
            </tr>
          ) : (
            matrixRows.map((row, idx) => {
              const {
                program, kegiatan: keg, subKegiatan: sub,
                isFirstRowOfProgram, progRowSpan,
                isFirstRowOfKegiatan, kegRowSpan, nodeCode
              } = row;

              return (
                <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  {/* Node / Kode SubKegiatan or Kegiatan */}
                  <td style={{ ...tdStyle, whiteSpace: 'nowrap', fontWeight: 600, color: '#334155' }}>
                    {nodeCode}
                  </td>

                  {/* Program Group Columns */}
                  {isFirstRowOfProgram && (
                    <>
                      <td rowSpan={progRowSpan} style={{ ...tdStyle, fontWeight: 700, verticalAlign: 'top', background: '#fff' }}>
                        {program.nama}
                      </td>
                      <td rowSpan={progRowSpan} style={{ ...tdStyle, verticalAlign: 'top', background: '#fff' }}>
                        {program.sasaran || program.deskripsi || '-'}
                      </td>
                      <td rowSpan={progRowSpan} style={{ ...tdStyle, verticalAlign: 'top', background: '#fff' }}>
                        {program.indikator || 'SAKIP'}
                      </td>
                      <td rowSpan={progRowSpan} style={{ ...tdStyle, textAlign: 'center', verticalAlign: 'top', background: '#fff' }}>
                        {program.target || '83'}
                      </td>
                    </>
                  )}

                  {/* Kegiatan Group Columns */}
                  {isFirstRowOfKegiatan && (
                    <>
                      <td rowSpan={kegRowSpan} style={{ ...tdStyle, fontWeight: 600, verticalAlign: 'top', background: '#fff' }}>
                        {keg?.nama || '-'}
                      </td>
                      <td rowSpan={kegRowSpan} style={{ ...tdStyle, verticalAlign: 'top', background: '#fff' }}>
                        {keg?.sasaran || '-'}
                      </td>
                      <td rowSpan={kegRowSpan} style={{ ...tdStyle, verticalAlign: 'top', background: '#fff' }}>
                        {keg?.indikator || '-'}
                      </td>
                      <td rowSpan={kegRowSpan} style={{ ...tdStyle, textAlign: 'center', verticalAlign: 'top', background: '#fff' }}>
                        {keg?.target || '-'}
                      </td>
                    </>
                  )}

                  {/* Sub Kegiatan Columns */}
                  <td style={tdStyle}>
                    {sub?.nama || '-'}
                  </td>
                  <td style={tdStyle}>
                    {sub?.sasaran || '-'}
                  </td>
                  <td style={tdStyle}>
                    {sub?.indikator || '-'}
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'center', whiteSpace: 'nowrap' }}>
                    {sub?.target || '-'}
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600, whiteSpace: 'nowrap' }}>
                    {sub ? formatAnggaranMatriks(sub.anggaran) : '-'}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

const thStyle = {
  padding: '8px 10px',
  fontSize: '0.75rem',
  fontWeight: 700,
  color: '#1e293b',
  borderRight: '1px solid #cbd5e1',
  borderBottom: '2px solid #cbd5e1',
  textAlign: 'left',
  background: '#f1f5f9',
  whiteSpace: 'nowrap',
};

const tdStyle = {
  padding: '8px 10px',
  borderRight: '1px solid #e2e8f0',
  borderBottom: '1px solid #e2e8f0',
  verticalAlign: 'top',
  lineHeight: '1.4',
};
