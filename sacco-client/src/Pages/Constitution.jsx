export default function Constitution() {
  const PDF_URL = '/constitution.pdf'

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="section-title">⚖️ Constitution</h2>
          <p className="text-gray-500 text-sm mt-1">
            Our governance document — your rights and responsibilities
          </p>
        </div>
        <a
          href={PDF_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary"
        >
          Open Full PDF ↗
        </a>
      </div>

      {/* Placeholder until PDF is uploaded */}
      <div className="card text-center py-16">
        <div className="text-5xl mb-4">📄</div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">
          Constitution Document
        </h3>
        <p className="text-gray-500 text-sm mb-6 max-w-md mx-auto">
          The Circle of Support constitution will be available here.
          Later nitadd the summary of the constitution, before we go live.
          To have key sections highlighted here for easy reference.
        </p>
        
        
      
        
       {/* Constitution highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-10 
          text-left max-w-2xl mx-auto">
          {[
            { title: 'Member Rights',
              text: 'Every member has equal voting rights and access to financial services.' },
            { title: 'Financial Rules',
              text: 'Transparent contribution, loan, and dividend distribution policies.' },
            { title: 'Governance',
              text: 'How elections, disputes, and executive decisions are handled.' },
          ].map(item => (
            <div key={item.title}
              className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <p className="text-2xl mb-2">{item.icon}</p>
              <p className="font-semibold text-gray-900 text-sm mb-1">
                {item.title}
              </p>
              <p className="text-gray-500 text-xs leading-relaxed">
                {item.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}