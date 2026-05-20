from typing import Optional
from pydantic import BaseModel
from app.utils.enums import StatusSolicitacao, TipoSolicitacao

class SolicitacaoCreate(BaseModel):
    identificador: str
    projeto_id: int
    tipo: TipoSolicitacao
    justificativa: Optional[str] = None
    mes_ano_referencia: Optional[str] = None

# --- NOVO SCHEMA ADICIONADO PARA A TASK 26761 ---
class SolicitacaoImplantacaoCreate(BaseModel):
    projeto_id: int
    identificador: str 
    # Justificativa e mes_ano_referencia omitidos propositalmente 
    # pois não pertencem ao fluxo de implantação inicial.

class SolicitacaoResponse(BaseModel):
    id: int
    identificador: str
    projeto_id: int
    tipo: TipoSolicitacao
    status: StatusSolicitacao
    justificativa: Optional[str]
    mes_ano_referencia: Optional[str]
    criado_por: int

    class Config:
        from_attributes = True