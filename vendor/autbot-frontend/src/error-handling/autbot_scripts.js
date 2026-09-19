document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('autbot-form');
    const childNameInput = document.getElementById('childName');
    const userQueryInput = document.getElementById('userQuery');
    const systemMessagesContainer = document.getElementById('system-messages-container');

    const ERROR_MESSAGES = {
        REQUIRED_FIELD: (fieldName) => `Por favor, informe ${fieldName}.`,
        IA_ERROR: "Estamos com dificuldade em gerar uma resposta agora. Você pode tentar novamente?",
        NETWORK_ERROR: "Verifique sua conexão com a internet e tente novamente.",
        GENERIC_SERVER_ERROR: "Algo deu errado ao tentar responder sua pergunta. Por favor, tente novamente em instantes."
    };

    /**
     * Exibe uma mensagem de erro.
     * @param {string} type - 'form' ou 'system'.
     * @param {string} message - A mensagem de erro.
     * @param {HTMLElement} [anchorElement] - Elemento de referência (input para 'form', container para 'system').
     * @param {object} [options] - Opções adicionais.
     * @param {string} [options.fieldId] - ID do campo de formulário (para 'form').
     * @param {boolean} [options.showRetryButton] - Mostrar botão "Tentar novamente" (para 'system').
     * @param {function} [options.onRetry] - Callback para o botão "Tentar novamente".
     */
    function displayError(type, message, anchorElement, options = {}) {
        // Remove erro anterior para este campo/tipo antes de adicionar um novo
        if (type === 'form' && options.fieldId) {
            removeError(anchorElement, options.fieldId);
        } else if (type === 'system') {
            // Para erros de sistema, podemos limpar todos antes de adicionar um novo,
            // ou gerenciar individualmente se necessário. Aqui, limpamos o container.
            // Se quiser múltiplos erros de sistema, ajuste esta lógica.
            // systemMessagesContainer.innerHTML = ''; // Comente se quiser múltiplos erros de sistema
        }

        const errorId = type === 'form' && options.fieldId ? `error-${options.fieldId}` : `error-system-${Date.now()}`;
        const errorElement = document.createElement('div');
        errorElement.id = errorId;
        errorElement.className = `error-message ${type}-error`;
        errorElement.setAttribute('role', 'alert');

        let icon = '';
        if (type === 'form') {
            errorElement.setAttribute('aria-live', 'assertive');
            icon = '❌'; // Ícone para erro de formulário
        } else { // system error
            errorElement.setAttribute('aria-live', 'polite');
            icon = '⚠️'; // Ícone para erro de sistema
        }

        errorElement.innerHTML = `<span class="error-icon">${icon}</span> <span class="error-text">${message}</span>`;

        if (type === 'system' && options.showRetryButton && typeof options.onRetry === 'function') {
            const retryButton = document.createElement('button');
            retryButton.className = 'retry-button';
            retryButton.textContent = 'Tentar novamente';
            retryButton.addEventListener('click', () => {
                options.onRetry();
                errorElement.remove(); // Remove esta mensagem específica ao tentar novamente
            });
            errorElement.appendChild(retryButton);
        }

        if (type === 'form' && anchorElement) {
            anchorElement.classList.add('input-error');
            anchorElement.setAttribute('aria-invalid', 'true');
            anchorElement.setAttribute('aria-describedby', errorId);
            // Insere a mensagem de erro logo após o campo de input
            anchorElement.parentNode.insertBefore(errorElement, anchorElement.nextSibling);
        } else if (type === 'system' && anchorElement) {
            anchorElement.appendChild(errorElement);
        }
    }

    /**
     * Remove uma mensagem de erro de formulário associada a um campo.
     * @param {HTMLElement} inputElement - O elemento input.
     * @param {string} fieldId - O ID do campo.
     */
    function removeError(inputElement, fieldId) {
        if (!inputElement) return;
        inputElement.classList.remove('input-error');
        inputElement.removeAttribute('aria-invalid');
        inputElement.removeAttribute('aria-describedby');

        const errorId = `error-${fieldId}`;
        const errorElement = document.getElementById(errorId);
        if (errorElement && errorElement.parentNode === inputElement.parentNode) {
            errorElement.remove();
        }
    }

    // Validação do formulário
    form.addEventListener('submit', (event) => {
        event.preventDefault();
        let isValid = true;

        // Valida nome da criança
        if (!childNameInput.value.trim()) {
            displayError('form', ERROR_MESSAGES.REQUIRED_FIELD('o nome da criança'), childNameInput, { fieldId: 'childName' });
            isValid = false;
        } else {
            removeError(childNameInput, 'childName');
        }

        // Valida pergunta do usuário
        if (!userQueryInput.value.trim()) {
            displayError('form', ERROR_MESSAGES.REQUIRED_FIELD('a sua pergunta'), userQueryInput, { fieldId: 'userQuery' });
            isValid = false;
        } else {
            removeError(userQueryInput, 'userQuery');
        }

        if (isValid) {
            alert('Formulário enviado com sucesso! (simulação)');
            // Aqui você faria a submissão dos dados
            form.reset(); // Limpa o formulário
        }
    });

    // Remove erro do campo ao digitar
    [childNameInput, userQueryInput].forEach(input => {
        input.addEventListener('input', () => {
            // Validação simples para remover o erro. Pode ser mais complexa se necessário.
            if (input.value.trim()) {
                removeError(input, input.id);
            }
        });
    });

    // Simulação de erros de sistema
    document.getElementById('btn-simulate-ia-error').addEventListener('click', () => {
        displayError('system', ERROR_MESSAGES.IA_ERROR, systemMessagesContainer, {
            showRetryButton: true,
            onRetry: () => {
                alert('Tentando novamente a operação da IA... (simulação)');
                // Aqui você re-tentaria a operação real
            }
        });
    });

    document.getElementById('btn-simulate-network-error').addEventListener('click', () => {
        displayError('system', ERROR_MESSAGES.NETWORK_ERROR, systemMessagesContainer, {
            showRetryButton: true, // Pode fazer sentido tentar novamente após verificar a conexão
            onRetry: () => {
                alert('Tentando novamente após verificar a conexão... (simulação)');
            }
        });
    });
    
    document.getElementById('btn-simulate-generic-error').addEventListener('click', () => {
        // Exemplo de como você poderia usar com base em um status HTTP
        // if (status === 500) { ... }
        displayError('system', ERROR_MESSAGES.GENERIC_SERVER_ERROR, systemMessagesContainer, {
            showRetryButton: true,
            onRetry: () => {
                alert('Tentando novamente a operação do servidor... (simulação)');
            }
        });
    });

    document.getElementById('btn-clear-system-errors').addEventListener('click', () => {
        systemMessagesContainer.innerHTML = ''; // Limpa todos os erros de sistema
    });

    // Exemplo conceitual de como tratar respostas de API com status HTTP
    // async function fetchData() {
    //     try {
    //         const response = await fetch('/api/autbot');
    //         if (!response.ok) {
    //             if (response.status >= 500) {
    //                 displayError('system', ERROR_MESSAGES.GENERIC_SERVER_ERROR, systemMessagesContainer, { showRetryButton: true, onRetry: fetchData });
    //             } else if (response.status === 400) {
    //                 const errorData = await response.json(); // Supondo que o backend envie detalhes
    //                 displayError('system', errorData.message || "Erro na sua solicitação.", systemMessagesContainer);
    //             } // Adicionar mais casos conforme necessário
    //             return;
    //         }
    //         const data = await response.json();
    //         // Processar dados com sucesso
    //     } catch (error) { // Erro de rede ou similar
    //         displayError('system', ERROR_MESSAGES.NETWORK_ERROR, systemMessagesContainer, { showRetryButton: true, onRetry: fetchData });
    //     }
    // }
});