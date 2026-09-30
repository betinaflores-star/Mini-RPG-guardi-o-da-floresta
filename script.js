const STORAGE_KEY = "guardiao-da-floresta-v1";

const initialGameState = {
    player: { maxHealth: 100, health: 100, potions: 3, defending: false },
    enemy: { name: "Slime Sombrio", maxHealth: 80, health: 80 },
    battleFinished: false,
    log: ["A batalha começou."]
};

let gameState = structuredClone(initialGameState);


let elements = {};

function initElements() {
    elements = {
        playerHealthText: document.querySelector("#player-health-text"),
        playerHealthBar: document.querySelector("#player-health-bar"),
        potionCount: document.querySelector("#potion-count"),
        defenseStatus: document.querySelector("#defense-status"),
        enemyName: document.querySelector("#enemy-name"),
        enemyHealthText: document.querySelector("#enemy-health-text"),
        enemyHealthBar: document.querySelector("#enemy-health-bar"),
        turnMessage: document.querySelector("#turn-message"),
        attackButton: document.querySelector("#attack-button"),
        defendButton: document.querySelector("#defend-button"),
        healButton: document.querySelector("#heal-button"),
        restartButton: document.querySelector("#restart-button"),
        clearSaveButton: document.querySelector("#clear-save-button"),
        battleLog: document.querySelector("#battle-log")
    };
}


function randomInteger(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function limitValue(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

function addLog(message, type = "") {
    gameState.log.push({ text: message, type });
    if (gameState.log.length > 30) gameState.log.shift();
}


function saveGame() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(gameState));
}

function loadGame() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        try {
            gameState = JSON.parse(saved);
            return true;
        } catch (e) {
            localStorage.removeItem(STORAGE_KEY);
        }
    }
    return false;
}


function renderGame() {
    const playerPct = (gameState.player.health / gameState.player.maxHealth) * 100;
    const enemyPct = (gameState.enemy.health / gameState.enemy.maxHealth) * 100;

    elements.playerHealthText.textContent = `${gameState.player.health} / ${gameState.player.maxHealth}`;
    elements.enemyHealthText.textContent = `${gameState.enemy.health} / ${gameState.enemy.maxHealth}`;

    elements.playerHealthBar.style.width = `${playerPct}%`;
    elements.enemyHealthBar.style.width = `${enemyPct}%`;

    elements.playerHealthBar.classList.toggle("danger", playerPct <= 30);
    elements.enemyHealthBar.classList.toggle("danger", enemyPct <= 30);

    elements.potionCount.textContent = gameState.player.potions;
    elements.enemyName.textContent = gameState.enemy.name;

    elements.defenseStatus.textContent = gameState.player.defending ? "Defesa preparada" : "Defesa inativa";

    elements.attackButton.disabled = gameState.battleFinished;
    elements.defendButton.disabled = gameState.battleFinished;
    elements.healButton.disabled = gameState.battleFinished || gameState.player.potions <= 0;

    elements.restartButton.hidden = !gameState.battleFinished;

   
    elements.battleLog.innerHTML = "";
    gameState.log.forEach(item => {
        const li = document.createElement("li");
        li.textContent = typeof item === "string" ? item : item.text;
        if (item.type) li.classList.add(item.type);
        elements.battleLog.appendChild(li);
    });
    elements.battleLog.scrollTop = elements.battleLog.scrollHeight;
}


function checkBattleResult() {
    if (gameState.enemy.health <= 0) {
        gameState.enemy.health = 0;
        gameState.battleFinished = true;
        elements.turnMessage.textContent = "Vitória! O Guardião protegeu a floresta.";
        addLog("Vitória! O Guardião protegeu a floresta.", "success");
        saveGame();
        renderGame();
        return true;
    }

    if (gameState.player.health <= 0) {
        gameState.player.health = 0;
        gameState.battleFinished = true;
        elements.turnMessage.textContent = "Derrota. A criatura dominou a floresta.";
        addLog("Derrota. A criatura dominou esta parte da floresta.", "danger");
        saveGame();
        renderGame();
        return true;
    }

    return false;
}

function enemyTurn() {
    if (gameState.battleFinished) return;

    let damage = randomInteger(8, 18);

    if (gameState.player.defending) {
        damage = Math.ceil(damage / 2);
        gameState.player.defending = false;
        addLog(`A defesa reduziu o ataque para ${damage} de dano.`, "warning");
    } else {
        addLog(`${gameState.enemy.name} causou ${damage} de dano.`, "danger");
    }

    gameState.player.health = limitValue(gameState.player.health - damage, 0, gameState.player.maxHealth);
    elements.turnMessage.textContent = "Sua vez. Escolha uma ação.";

    checkBattleResult();
    saveGame();
    renderGame();
}

function attack() {
    if (gameState.battleFinished) return;

    const damage = randomInteger(12, 24);
    gameState.enemy.health = limitValue(gameState.enemy.health - damage, 0, gameState.enemy.maxHealth);

    elements.turnMessage.textContent = `Você atacou e causou ${damage} de dano.`;
    addLog(`O Guardião atacou e causou ${damage} de dano.`, "success");

    if (!checkBattleResult()) {
        enemyTurn();
    }
}

function defend() {
    if (gameState.battleFinished) return;

    gameState.player.defending = true;
    elements.turnMessage.textContent = "Você preparou a defesa.";
    addLog("O Guardião assumiu uma postura defensiva.", "warning");

    saveGame();
    renderGame();
    enemyTurn();
}

function heal() {
    if (gameState.battleFinished || gameState.player.potions <= 0) return;

    if (gameState.player.health >= gameState.player.maxHealth) {
        elements.turnMessage.textContent = "Sua vida já está completa!";
        return;
    }

    const healAmount = randomInteger(18, 32);
    gameState.player.health = limitValue(gameState.player.health + healAmount, 0, gameState.player.maxHealth);
    gameState.player.potions -= 1;

    elements.turnMessage.textContent = `Você recuperou vida!`;
    addLog(`O Guardião usou uma poção. Restam ${gameState.player.potions}.`, "success");

    saveGame();
    renderGame();
    enemyTurn();
}

function restartGame() {
    gameState = structuredClone(initialGameState);
    localStorage.removeItem(STORAGE_KEY);
    elements.turnMessage.textContent = "Nova batalha iniciada!";
    saveGame();
    renderGame();
}

function clearSavedProgress() {
    localStorage.removeItem(STORAGE_KEY);
    restartGame();
}

document.addEventListener("DOMContentLoaded", () => {
    initElements();
    const recovered = loadGame();
    
    elements.attackButton.addEventListener("click", attack);
    elements.defendButton.addEventListener("click", defend);
    elements.healButton.addEventListener("click", heal);
    elements.restartButton.addEventListener("click", restartGame);
    elements.clearSaveButton.addEventListener("click", clearSavedProgress);

    renderGame();
    elements.turnMessage.textContent = recovered ? "Progresso recuperado!" : "Escolha sua primeira ação.";
});