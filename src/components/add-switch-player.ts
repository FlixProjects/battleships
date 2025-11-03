export const addSwitchPlayerBtn = () => {
    const switchPlayerButtonContainer = document.createElement("div");

    const switchPlayerButton = document.createElement("button");

    switchPlayerButton.id = "switchPlayerBtn";
    switchPlayerButton.innerText = "Switch Player";
    switchPlayerButton.className = "btn secondary";

    switchPlayerButtonContainer.appendChild(switchPlayerButton);

    document.getElementById("controls").appendChild(switchPlayerButtonContainer);
};
