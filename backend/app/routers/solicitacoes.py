from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, status

from app.core.dependencies import get_current_user, get_solicitacao_service
from app.models.usuario_perfil import Usuario
from app.schemas.solicitacao import SolicitacaoCreate, SolicitacaoImplantacaoCreate, SolicitacaoResponse
from app.services.solicitacao_service import SolicitacaoService

router = APIRouter()

# --- NOVO ENDPOINT ESPECÍFICO PARA A TASK 26761 ---
@router.post("/implantacao", response_model=SolicitacaoResponse, status_code=status.HTTP_201_CREATED)
def criar_solicitacao_implantacao(
    dados: SolicitacaoImplantacaoCreate,
    service: SolicitacaoService = Depends(get_solicitacao_service),
    current_user: Usuario = Depends(get_current_user),
):
    """
    Criar nova solicitação exclusiva de IMPLANTAÇÃO de RH.
    Gera automaticamente a primeira versão (Proposta) vinculada ao projeto.
    """
    return service.criar_implantacao(dados, current_user)

# --- ENDPOINTS ORIGINAIS MANTIDOS INTACTOS ---
@router.post("/", response_model=SolicitacaoResponse, status_code=status.HTTP_201_CREATED)
def criar_solicitacao(
    dados: SolicitacaoCreate,
    service: SolicitacaoService = Depends(get_solicitacao_service),
    current_user: Usuario = Depends(get_current_user),
):
    """
    Criar nova solicitacao de RH.

    - IMPLANTACAO: Cria primeira versao de RH do projeto
    - ALTERACAO: Clona versao vigente como base editavel
    - PAGAMENTO: Lista membros ativos no mes/ano
    """
    return service.criar(dados, current_user)

@router.get("/", response_model=List[SolicitacaoResponse])
def listar_solicitacoes(
    projeto_id: Optional[int] = None,
    service: SolicitacaoService = Depends(get_solicitacao_service),
    current_user: Usuario = Depends(get_current_user),
):
    """Listar solicitacoes de RH."""
    return service.listar(current_user, projeto_id=projeto_id)

@router.get("/{solicitacao_id}", response_model=SolicitacaoResponse)
def obter_solicitacao(
    solicitacao_id: int,
    service: SolicitacaoService = Depends(get_solicitacao_service),
    _: Usuario = Depends(get_current_user),
):
    """Obter detalhes de uma solicitacao."""
    return service.obter_por_id(solicitacao_id)


@router.post("/{solicitacao_id}/submeter", response_model=SolicitacaoResponse)
def submeter_solicitacao(
    solicitacao_id: int,
    service: SolicitacaoService = Depends(get_solicitacao_service),
    current_user: Usuario = Depends(get_current_user),
):
    """
    Submeter solicitacao de RH.
    Muda status EM_EDICAO -> SUBMETIDA e promove versao PROPOSTA -> VIGENTE.
    Para ALTERACAO, a versao anterior VIGENTE passa a HISTORICO.
    """
    return service.submeter(solicitacao_id, current_user)


@router.get("/{solicitacao_id}/comparacao")
def comparar_solicitacao(
    solicitacao_id: int,
    service: SolicitacaoService = Depends(get_solicitacao_service),
    _: Usuario = Depends(get_current_user),
) -> Dict[str, Any]:
    """
    Retorna comparacao Antes/Depois da solicitacao.
    Para IMPLANTACAO: antes vazio, depois = equipe proposta.
    Para ALTERACAO: antes = versao vigente, depois = versao proposta.
    """
    return service.comparar(solicitacao_id)