import React, { useState } from 'react'
import ProposalTemplateEditor from '../../components/ProposalTemplateEditor'
import ProposalGenerator from '../../components/ProposalGenerator'

export default function ProposalsPage() {
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null)

  return (
    <div>
      <h2>Propostas Fotovoltaicas</h2>

      <div className="card">
        <h3>Editor de Template</h3>
        <ProposalTemplateEditor onTemplateSaved={(id) => setSelectedTemplateId(id)} />
      </div>

      <div className="card">
        <h3>Gerador de Propostas</h3>
        <ProposalGenerator selectedTemplateId={selectedTemplateId} />
      </div>
    </div>
  )
}
