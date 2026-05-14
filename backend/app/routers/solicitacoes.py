from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel

from app.core.dependencies import get_db, get_current_user
from app.models.usuario_perfil import Usuario
from app.models.solicitacao_rh import SolicitacaoRH
from app.models.projeto import Projeto
from app.models.versao_rh_projeto import VersaoRHProjeto
from app.utils.enums import TipoSolicitacao, StatusSolicitacao, StatusVersaoRH

router = APIRouter()


class SolicitacaoCreate(BaseModel):
    identificador: str
    projeto_id: int
    tipo: TipoSolicitacao
    justificativa: Optional[str] = None
    mes_ano_referencia: Optional[str] = None  # Para tipo PAGAMENTO


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


@router.post("/", response_model=SolicitacaoResponse, status_code=status.HTTP_201_CREATED)
def criar_solicitacao(
    dados: SolicitacaoCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Criar nova solicitacao de RH.

    - IMPLANTACAO: Cria primeira versao de RH do projeto
    - ALTERACAO: Clona versao vigente como base editavel
    - PAGAMENTO: Lista membros ativos no mes/ano
    """
    # Verificar se projeto existe
    projeto = db.query(Projeto).filter(Projeto.id == dados.projeto_id).first()
    if not projeto:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Projeto nao encontrado"
        )

    # Verificar permissao (coordenador do projeto)
    if current_user.perfil.value == "COORDENADOR":
        if projeto.coordenador_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Voce nao e coordenador deste projeto"
            )

    # Criar solicitacao
    solicitacao = SolicitacaoRH(
        identificador=dados.identificador,
        projeto_id=dados.projeto_id,
        tipo=dados.tipo,
        justificativa=dados.justificativa,
        mes_ano_referencia=dados.mes_ano_referencia,
        status=StatusSolicitacao.EM_EDICAO,
        criado_por=current_user.id
    )
    db.add(solicitacao)
    db.flush()

    # Criar versao de RH conforme tipo
    if dados.tipo == TipoSolicitacao.IMPLANTACAO:
        # Verificar se ja existe versao para o projeto
        versao_existente = db.query(VersaoRHProjeto).filter(
            VersaoRHProjeto.projeto_id == dados.projeto_id
        ).first()

        if versao_existente:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Projeto ja possui versao de RH. Use tipo ALTERACAO."
            )

        versao = VersaoRHProjeto(
            projeto_id=dados.projeto_id,
            numero_versao=1,
            status=StatusVersaoRH.PROPOSTA,
            solicitacao_id=solicitacao.id
        )
        db.add(versao)

    elif dados.tipo == TipoSolicitacao.ALTERACAO:
        # Buscar ultima versao vigente
        versao_vigente = db.query(VersaoRHProjeto).filter(
            VersaoRHProjeto.projeto_id == dados.projeto_id,
            VersaoRHProjeto.status == StatusVersaoRH.VIGENTE
        ).first()

        if not versao_vigente:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Nao existe versao vigente para alteracao. Use tipo IMPLANTACAO."
            )

        # Criar nova versao
        nova_versao = VersaoRHProjeto(
            projeto_id=dados.projeto_id,
            numero_versao=versao_vigente.numero_versao + 1,
            status=StatusVersaoRH.PROPOSTA,
            solicitacao_id=solicitacao.id
        )
        db.add(nova_versao)
        db.flush()

        # Clonar membros da versao vigente para a nova versao
        # (implementar no service)

    db.commit()
    db.refresh(solicitacao)

    return solicitacao


@router.get("/", response_model=List[SolicitacaoResponse])
def listar_solicitacoes(
    projeto_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """Listar solicitacoes de RH."""
    query = db.query(SolicitacaoRH)

    if projeto_id:
        query = query.filter(SolicitacaoRH.projeto_id == projeto_id)

    # Filtrar por perfil
    if current_user.perfil.value == "COORDENADOR":
        query = query.join(Projeto).filter(Projeto.coordenador_id == current_user.id)

    return query.all()


@router.get("/{solicitacao_id}", response_model=SolicitacaoResponse)
def obter_solicitacao(
    solicitacao_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """Obter detalhes de uma solicitacao."""
    solicitacao = db.query(SolicitacaoRH).filter(SolicitacaoRH.id == solicitacao_id).first()

    if not solicitacao:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Solicitacao nao encontrada"
        )

    return solicitacao
