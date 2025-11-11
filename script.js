document.addEventListener("DOMContentLoaded", () => {
    const wheel = document.getElementById("wheel");
    const spinButton = document.getElementById("spinButton");
    const prizeResult = document.getElementById("prizeResult");
    const prizeText = document.getElementById("prizeText");
    const claimButton = document.getElementById("claimButton");
    const closeButton = document.getElementById("closeButton");
    const modal = document.getElementById("modal");
    const reveal = document.getElementById("reveal");
    const retryButton = document.getElementById("retryButton");
    const prankAudio = document.getElementById("prankAudio");
    const audioFallback = document.getElementById("audioFallback");
    const playAudioButton = document.getElementById("playAudioButton");

    let isSpinning = false;

    const fakePrizes = [
        { label: "谢谢参与", type: "miss" },
        { label: "差一点点", type: "miss" },
        { label: "中一百万彩票", type: "hit" },
        { label: "单身+20年", type: "hit" },
        { label: "喝一杯", type: "hit" },
        { label: "神秘大奖", type: "hit" },
        { label: "买入日日红股票", type: "hit" },
        { label: "免费告诉你一个秘密", type: "hit" }
    ];

    spinButton.addEventListener("click", () => {
        if (isSpinning) {
            return;
        }
        isSpinning = true;

        const spins = Math.floor(Math.random() * 5) + 5;
        const targetIndex = Math.floor(Math.random() * fakePrizes.length);
        const segmentAngle = 360 / fakePrizes.length;
        const targetAngle = 360 - (targetIndex * segmentAngle + segmentAngle / 2);
        const endAngle = 360 * spins + targetAngle;

        wheel.style.transform = `rotate(${endAngle}deg)`;
        prizeResult.style.display = "none";
        claimButton.hidden = true;
        spinButton.disabled = true;
        spinButton.textContent = "抽奖中…";

        window.setTimeout(() => {
            const fakePrize = fakePrizes[targetIndex];
            const message =
                fakePrize.type === "miss"
                    ? `😅 ${fakePrize.label}！别灰心，再接再厉，点击领取奖励继续冲！`
                    : `🎉 恭喜抽中：${fakePrize.label}！快点击领取奖励！`;
            prizeText.textContent = message;
            prizeResult.style.display = "block";
            claimButton.hidden = false;
            claimButton.focus();
            spinButton.textContent = "再抽一次";
            spinButton.disabled = false;
            isSpinning = false;
        }, 5200);
    });

    const playPrankAudio = () => {
        if (prankAudio.readyState < 2) {
            prankAudio.load();
        }
        prankAudio.currentTime = 0;
        const playPromise = prankAudio.play();
        if (playPromise && typeof playPromise.catch === "function") {
            playPromise.catch(() => {
                if (audioFallback) {
                    audioFallback.hidden = false;
                }
            });
        }
    };

    claimButton.addEventListener("click", () => {
        modal.style.display = "none";
        reveal.hidden = false;
        if (audioFallback) {
            audioFallback.hidden = true;
        }
        playPrankAudio();
    });

    closeButton.addEventListener("click", () => {
        modal.style.display = "none";
    });

    retryButton.addEventListener("click", () => {
        reveal.hidden = true;
        modal.style.display = "flex";
        prankAudio.pause();
        prankAudio.currentTime = 0;
        if (audioFallback) {
            audioFallback.hidden = true;
        }
    });

    if (playAudioButton) {
        playAudioButton.addEventListener("click", () => {
            if (audioFallback) {
                audioFallback.hidden = true;
            }
            if (prankAudio.readyState < 2) {
                prankAudio.load();
            }
            playPrankAudio();
        });
    }
});

