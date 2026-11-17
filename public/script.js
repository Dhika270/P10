const chat = document.getElementById("chat");
const input = document.getElementById("input");
const kirim = document.getElementById("kirim");
const messages = [];

function tambahPesan(teks, tipe) {
    const el = document.createElement("div");
    el.className = "msg " + tipe;
    el.textContent = teks;
    chat.appendChild(el);
    chat.scrollTop = chat.scrollHeight;
    return el;
}

async function kirimPesan() {
    const teks = input.value.trim();
    if (!teks) return;

    input.value = "";
    kirim.disabled = true;

    messages.push({ role: "user", content: teks });
    tambahPesan(teks, "user");
    const balasan = tambahPesan("...", "bot");

    try {
        const res = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ messages })
        });

        if (!res.ok) {
            balasan.textContent = "Error: " + (await res.text());
            return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let hasil = "";
        let buffer = "";

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop();

            for (const line of lines) {
                if (!line.startsWith("data:")) continue;

                const data = line.slice(5).trim();
                if (data === "[DONE]") continue;

                hasil += JSON.parse(data);
                balasan.textContent = hasil;
                chat.scrollTop = chat.scrollHeight;
            }
        }

        messages.push({ role: "assistant", content: hasil });
    } catch (err) {
        balasan.textContent = "Terjadi kesalahan koneksi.";
    } finally {
        kirim.disabled = false;
        input.focus();
    }
}

kirim.addEventListener("click", kirimPesan);
input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") kirimPesan();
});