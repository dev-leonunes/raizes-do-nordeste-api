# Diagrama de casos de uso

```mermaid
flowchart LR
  Cliente["Cliente"]
  Atendente["Atendente"]
  Cozinha["Cozinha"]
  Gerente["Gerente"]
  Admin["Administrador"]
  Gateway["Sistema externo de pagamento (mock)"]

  Login(("Autenticar usuário"))
  Cardapio(("Consultar cardápio por unidade"))
  CriarPedido(("Criar pedido multicanal"))
  SolicitarPagamento(("Solicitar pagamento mock"))
  RegistrarRetornoPagamento(("Registrar retorno do pagamento"))
  ConsultarPedido(("Consultar pedidos"))
  AtualizarStatus(("Atualizar status do pedido"))
  CancelarPedido(("Cancelar pedido"))
  ConsultarEstoque(("Consultar estoque"))
  MovimentarEstoque(("Movimentar estoque"))
  ConsultarUsuarios(("Consultar usuários"))
  ConsultarAuditoria(("Consultar auditorias"))

  Cliente --> Login
  Cliente --> Cardapio
  Cliente --> CriarPedido
  Cliente --> SolicitarPagamento
  Cliente --> ConsultarPedido
  Cliente --> CancelarPedido

  Atendente --> Login
  Atendente --> CriarPedido
  Atendente --> ConsultarPedido

  Cozinha --> Login
  Cozinha --> ConsultarPedido
  Cozinha --> AtualizarStatus

  Gerente --> Login
  Gerente --> ConsultarPedido
  Gerente --> AtualizarStatus
  Gerente --> ConsultarEstoque
  Gerente --> MovimentarEstoque
  Gerente --> CancelarPedido

  Admin --> Login
  Admin --> ConsultarUsuarios
  Admin --> ConsultarPedido
  Admin --> AtualizarStatus
  Admin --> ConsultarEstoque
  Admin --> MovimentarEstoque
  Admin --> CancelarPedido
  Admin --> ConsultarAuditoria

  SolicitarPagamento --> Gateway
  Gateway --> RegistrarRetornoPagamento
  RegistrarRetornoPagamento --> AtualizarStatus
```
