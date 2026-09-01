/* 
    VARIABLES
*/

let books= [];

/* 
    INICIACIÓN
*/

document.addEventListener("DOMContentLoaded", () => {
    loadBooks();
});

/*
    CARGAR CATÁLOGO
*/

async function loadBooks() { 
    try { 
        const response = await fetch("data/books.json"); 
        
        if (!response.ok) { 
            throw new Error("No se pudo cargar books.json"); 
        } 
        
        const data = await response.json(); 
        books = data.books; 
        
        console.log("Catálogo cargado:", books); 
        
        renderBooks(); 

    } catch (error) { 
        console.error( "Error cargando el catálogo:", error ); 
    } 
}

/*
    MOSTRAR LIBROS
*/

function renderBooks() { 

    const booksGrid = document.querySelector(".books-grid"); 
    
    if (!booksGrid) { 
        console.error( "No se encontró .books-grid en el HTML" ); 
        return; 
    } 
    
    booksGrid.innerHTML = ""; 
    
    books.forEach(book => { 
        const bookCard = createBookCard(book); 
        booksGrid.appendChild(bookCard); 
    }); 
}

/*
    CREACIÓN DE TARJETA
*/

function createBookCard(book) { 
    
    const article = document.createElement("article"); 
    
    article.className = "book-card"; 

    /* Si el libro está leído, añadimos la clase .read. */ 
    if (book.read) { 
        article.classList.add("read"); 
    } 
    
    /* Creamos la portada. */ 
    const coverWrapper = document.createElement("div"); 
    coverWrapper.className = "book-cover-wrapper"; 
    const cover = document.createElement("div"); 
    cover.className = "book-cover"; 
    
    /* Imagen de portada. */ 
    const coverImage = document.createElement("img"); 
    coverImage.src = book.cover; 
    coverImage.alt = `Portada de ${book.title}`; 
    
    /* Si la imagen no existe, mostramos una portada alternativa. */ 
    coverImage.onerror = () => { 
        coverImage.style.display = "none"; 
        cover.classList.add("cover-fallback"); 
        cover.innerHTML = ` 
            <strong>${book.title}</strong> 
            <small>${book.author}</small> 
        `;
    }; 
    
    /* Estado del libro. */ 
    if (book.read) { 
        const status = document.createElement("div"); 
        status.className = "book-status read-status"; 
        status.innerHTML = `<i class="fa-solid fa-check"></i> LEÍDO`; 
        coverWrapper.appendChild(status); 
    } 
    
    /* Botón de favorito. */ 
    const favoriteButton = document.createElement("button"); 
    favoriteButton.className = "favorite-button"; 
    favoriteButton.setAttribute( 
        "aria-label", 
        book.favorite 
            ? `Quitar ${book.title} de favoritos` 
            : `Añadir ${book.title} a favoritos` 
    ); 
    favoriteButton.innerHTML = 
        book.favorite 
            ? `<i class="fa-solid fa-star"></i>` 
            : `<i class="fa-regular fa-star"></i>`; 
    
    /* Construimos la portada. */ 
    cover.appendChild(coverImage); 
    coverWrapper.appendChild(cover); 
    coverWrapper.appendChild( favoriteButton ); 
    
    /* Información del libro. */ 
    const info = document.createElement("div"); 
    info.className = "book-info"; 
    info.innerHTML = ` 
        <h3>${escapeHTML(book.title)}</h3> 
        <p>${escapeHTML(book.author)}</p> 
        <div class="book-meta"> 
            <span>${escapeHTML(book.genre)}</span> 
            <span>${book.year}</span> </div> 
    `; 
    
    /* Montamos la tarjeta completa. */ 
    article.appendChild(coverWrapper); 
    article.appendChild(info); 
    return article; 
}

/*
    SEGURIDAD
*/

/* Evita introducir directamente texto procedente del 
catálogo dentro de HTML. 
*/ 

function escapeHTML(text) { 
    const element = document.createElement("div"); 
    element.textContent = text ?? ""; 
    return element.innerHTML; 
}

