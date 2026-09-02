/* 
    VARIABLES
*/

let books= [];
let currentView = "home";
let previousView = "home";

/* 
    INICIACIÓN
*/

document.addEventListener("DOMContentLoaded", () => {
    loadBooks();
    setupNavigation();
});

/*
    CARGAR CATÁLOGO
*/

async function loadBooks() { 
    try { 
        const response = await fetch("../data/books.json"); 
        
        if (!response.ok) { 
            throw new Error("No se pudo cargar books.json"); 
        } 
        
        const data = await response.json(); 
        books = data.books || [];
        
        console.log("Catálogo cargado:", books); 

        updateStatistics();
        
        renderHome();

    } catch (error) { 
        console.error( "Error cargando el catálogo:", error ); 
    } 
}

/*
    ESTADÍSTICAS
*/

function updateStatistics() { 
    const totalBooks = books.length; 
    const totalRead = books.filter( book => book.read ).length; 
    const authors = 
        new Set( books 
                .map(book => book.author) 
                .filter(Boolean) 
            );
    const genres = 
        new Set( books 
                .map(book => book.genre) 
                .filter(Boolean) 
            );
    /*Estadisticas principales*/
    setText( "total-books", totalBooks ); 
    setText( "total-authors", authors.size ); 
    setText( "total-read", totalRead ); 
    setText( "total-genres", genres.size ); 
    /* Estadísticas del sidebar*/ 
    setText( "sidebar-book-count", totalBooks ); 
    setText( "sidebar-author-count", authors.size ); 
}

/*
    PAGINA PRINCIPAL
*/

function renderHome() { 
    currentView = "home"; 
    showHomeSections();

    /*Libros añadidos recientemente*/
    const recentBooks = books.slice(0, 8); 
    renderBooksInto( "recent-books", recentBooks );

    /*Libros leidos*/
    const readBooks = 
        books 
            .filter(book => book.read) 
            .slice(0, 8); 
    
    renderBooksInto( "read-books", readBooks );

    /*Estado vacío*/
    updateEmptyState( books.length === 0 ); 
}

/*
    CARGAR TODOS LOS LIBROS
*/

function renderAllBooks() { 
    currentView = "all"; 
    hideHomeSections(); 
    const mainContent = document.querySelector( ".main-content" ); 
    removeDynamicView();

    const view = createLibraryView( "Todos los libros", "TU COLECCIÓN", books );
    
    mainContent.appendChild( view ); 
}

/*
    CARGAR LIBROS LEIDOS
*/

function renderReadBooks() { 
    currentView = "read"; 
    hideHomeSections(); 
    const mainContent = document.querySelector( ".main-content" ); 
    removeDynamicView(); 

    /* Filtramos únicamente los libros cuyo valor read sea true.*/
    const readBooks = books.filter( book => book.read ); 
    
    /* Utilizamos la misma tarjeta que en Inicio y Todos los libros.*/ 
    const view = createLibraryView( "Libros leídos", "TU HISTORIAL", readBooks ); 
    
    mainContent.appendChild( view ); 
}

/*
    CARGAR FAVORITOS
*/

function renderFavoriteBooks() { 
    currentView = "favorites"; 
    hideHomeSections(); 
    const mainContent = document.querySelector( ".main-content" );
    removeDynamicView(); 
    
    /* Filtramos únicamente los libros marcados como favoritos.*/ 
    const favoriteBooks = books.filter( book => book.favorite ); 
    
    /* Misma tarjeta visual que en el resto de la aplicación.*/ 
    const view = createLibraryView( "Favoritos", "TU COLECCIÓN", favoriteBooks ); 
    
    mainContent.appendChild( view ); 
}

/*
    CARGAR FICHA DEL LIBRO
*/

function renderBookDetail(book) {

    if (!book) {
        return;
    }

    previousView = currentView;
    currentView = "detail";

    hideHomeSections();
    removeDynamicView();

    const mainContent = document.querySelector(".main-content");

    if (!mainContent) {
        return;
    }

    const view = document.createElement("section");
    view.className = "book-detail dynamic-view";

    view.innerHTML = `
        <button class="detail-back-button" type="button">
            <i class="fa-solid fa-arrow-left"></i>
            Volver
        </button>

        <div class="book-detail-content">

            <div class="book-detail-cover">
                <img
                    src="${escapeHTML(book.cover || "")}"
                    alt="Portada de ${escapeHTML(book.title)}"
                >
            </div>

            <div class="book-detail-info">

                <span class="section-eyebrow">
                    ${escapeHTML(book.genre || "LIBRO")}
                </span>

                <h1>${escapeHTML(book.title)}</h1>

                <p class="book-detail-author">
                    ${escapeHTML(book.author || "Autor desconocido")}
                </p>

                <div class="book-detail-meta">
                    ${book.year ? `<span>${escapeHTML(String(book.year))}</span>` : ""}
                    ${book.read ? `<span><i class="fa-solid fa-check"></i> Leído</span>` : ""}
                </div>

                ${
                    book.description
                        ? `
                            <div class="book-detail-description">
                                <p>${escapeHTML(book.description)}</p>
                            </div>
                        `
                        : ""
                }

                <div class="book-detail-actions">

                    <button class="favorite-detail-button" type="button">
                        ${
                            book.favorite
                                ? `<i class="fa-solid fa-star"></i> Quitar de favoritos`
                                : `<i class="fa-regular fa-star"></i> Añadir a favoritos`
                        }
                    </button>

                    <button class="read-detail-button" type="button">
                        ${
                            book.read
                                ? `<i class="fa-solid fa-check"></i> Marcar como no leído`
                                : `<i class="fa-regular fa-circle-check"></i> Marcar como leído`
                        }
                    </button>
                </div>
            </div>
        </div>
    `;

    //Boton para volver atrás
    const backButton = view.querySelector(".detail-back-button");

    backButton.addEventListener("click", () => {

        if (currentView !== "detail") {
            return;
        }

        // Volvemos a la vista desde la que abrimos el libro.
        switch (previousView) {

            case "home":
                setActiveNavByText("Inicio");
                renderHome();
                break;

            case "all":
                setActiveNavByText("Todos los libros");
                renderAllBooks();
                break;

            case "favorites":
                setActiveNavByText("Favoritos");
                renderFavoriteBooks();
                break;

            case "read":
                setActiveNavByText("Leídos");
                renderReadBooks();
                break;

            default:
                setActiveNavByText("Inicio");
                renderHome();
                break;
        }
    });

    //Favoritos sigue siendo una acción disponible desde la ficha.
    const favoriteButton = view.querySelector(".favorite-detail-button");

    favoriteButton.addEventListener("click", () => {
        toggleFavorite(book.id);
        renderBookDetail(book);
    });

    const readButton = view.querySelector(".read-detail-button");

    readButton.addEventListener("click", () => {
        toggleRead(book.id);
        renderBookDetail(book);
    });

    mainContent.appendChild(view);
}

/*
    VISTA DE BIBLIOTECA
*/

function createLibraryView( title, eyebrow, bookList ) { 
    const section = document.createElement( "section" ); 
    section.className = "library-section dynamic-view";

    section.innerHTML = ` 
        <div class="section-header"> 
            <div> 
                <span class="section-eyebrow"> 
                    ${escapeHTML(eyebrow)} 
                </span> 
                <h2> 
                    ${escapeHTML(title)} 
                </h2> 
            </div> 
            <span class="view-count"> 
                ${bookList.length} 
                ${bookList.length === 1 ? "libro" : "libros"} 
            </span> 
        </div> 
        <div class="books-grid dynamic-books-grid"> </div> 
    `;

    const grid = section.querySelector( ".dynamic-books-grid" );

    /* Si no hay libros mostramos un mensaje. */ 
    if (bookList.length === 0) { 
        grid.innerHTML = ` 
            <div class="inline-empty-state"> 
                <div class="empty-icon"> 
                    <i class="fa-solid fa-book-open"></i> 
                </div> 
                <h3> No hay libros aquí todavía </h3> 
                <p> Cuando añadas libros a esta sección, aparecerán aquí. </p> 
            </div> 
        `; 
    } else { 
        bookList.forEach(book => { 
            const card = createBookCard(book); 
            grid.appendChild( card ); }); 
    }

    return section; 
}

/*
    RENDERIZAR LIBROS EN UN GRID
*/

function renderBooksInto( containerId, bookList ) { 
    const container = document.getElementById( containerId ); 
    
    if (!container) { 
        return; 
    }
    
    container.innerHTML = "";

    if (bookList.length === 0) { 
        container.innerHTML = ` 
            <div class="inline-empty-state"> 
                <div class="empty-icon"> 
                    <i class="fa-solid fa-book-open"></i> 
                </div> 
                <h3> No hay libros todavía </h3> 
                <p> Esta sección se llenará automáticamente.</p> 
            </div> 
        `; 
        return; 
    }

    bookList.forEach(book => { 
        const card = createBookCard(book); 
        container.appendChild( card ); 
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
    coverImage.loading = "lazy";
    
    /* Si la imagen no existe, mostramos una portada alternativa. */ 
    coverImage.onerror = () => { 
        coverImage.style.display = "none"; 
        cover.classList.add("cover-fallback"); 
        cover.innerHTML = ` 
            <strong>${escapeHTML( book.title )}</strong> 
            <small>${escapeHTML( book.author || "" )}</small> 
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
    favoriteButton.type = "button";
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
    
    favoriteButton.addEventListener( "click", event => { 
        event.stopPropagation(); 
        toggleFavorite( book.id ); 
    });

    /* Construimos la portada. */ 
    cover.appendChild(coverImage); 
    coverWrapper.appendChild(cover); 
    coverWrapper.appendChild( favoriteButton ); 
    
    /* Información del libro. */ 
    const info = document.createElement("div"); 
    info.className = "book-info"; 
    info.innerHTML = ` 
        <h3>${escapeHTML(book.title)}</h3> 
        <p>${escapeHTML(book.author || "")}</p> 
        <div class="book-meta"> 
            <span>${escapeHTML(book.genre || "")}</span> 
            <span>${book.year || ""}</span> </div>
    `; 
    
    /* Montamos la tarjeta completa. */ 
    article.appendChild(coverWrapper); 
    article.appendChild(info);

    /*Muestra el libro seleccionado por consola*/
    article.addEventListener( "click", () => { 
        renderBookDetail(book); 
    });

    return article; 
}

/*
    FAVORITOS
*/

function toggleFavorite( bookId ) { 
    const book = books.find( item => item.id === bookId ); 
    
    if (!book) { 
        return; 
    } 

    /* Cambiamos true ↔ false.*/ 
    book.favorite = !book.favorite; 
    console.log(
        `${book.title}:`, 
        book.favorite 
            ? "Añadido a favoritos" 
            : "Eliminado de favoritos" 
    );
    
    /* Actualizamos las estadísticas.*/ 
    updateStatistics(); 
    
    refreshCurrentView(); 
}

/*
    LEÍDO
*/

function toggleRead(bookId) {

    const book = books.find(item => item.id === bookId);

    if (!book) {
        return;
    }

    book.read = !book.read;

    console.log(
        `${book.title}:`,
        book.read
            ? "Marcado como leído"
            : "Marcado como no leído"
    );

    updateStatistics();
}

/*
    NAVEGACIÓN
*/

function setupNavigation() { 
    const navItems = document.querySelectorAll( ".main-nav .nav-item" ); 
    
    navItems.forEach( item => { 
        item.addEventListener( "click", event => { 
            event.preventDefault(); 
            const text = item .querySelector("span") ?.textContent .trim(); 
            setActiveNavItem( item ); 
            switch (text) { 
                case "Inicio": 
                    renderHome(); 
                    break; 
                case "Todos los libros": 
                    renderAllBooks(); 
                    break; 
                case "Favoritos": 
                    renderFavoriteBooks(); 
                    break; 
                case "Leídos": 
                    renderReadBooks(); 
                    break; 
                case "Autores": 
                    console.log( "Vista Autores: próximamente" ); 
                    break; 
                case "Géneros": 
                    console.log( "Vista Géneros: próximamente" ); 
                    break; 
            } 
        }); 
    });

    /* LOGO → INICIO */ 
    const logo = document.querySelector( ".logo" ); 
    if (logo) { 
        logo.addEventListener( "click", event => { 
            event.preventDefault(); 
            setActiveNavByText( "Inicio" ); 
            renderHome(); 
        }); 
    } 
    
    /* BOTONES "VER TODOS" */ 
    const viewAllLinks = document.querySelectorAll( ".view-all" ); 
    viewAllLinks.forEach( link => { 
        link.addEventListener( "click", event => { 
            event.preventDefault(); 
            const section = link.closest( ".library-section" ); 
            /* Si pertenece a la sección de libros leídos → Leídos.*/ 
            if ( section && section.classList.contains( "read-section" ) ) { 
                setActiveNavByText( "Leídos" ); 
                renderReadBooks(); 
            } else { 
                /* En Añadidos recientemente → Todos los libros.*/ 
                setActiveNavByText( "Todos los libros" ); 
                renderAllBooks(); 
            } 
        }); 
    }); 
}

/*
    NAVEGACIÓN ACTIVA
*/

function setActiveNavItem( activeItem ) { 
    document 
        .querySelectorAll( ".main-nav .nav-item" ) 
        .forEach( item => { 
            item.classList.remove( "active" ); 
        }); 
    
    activeItem.classList.add( "active" ); 
}

/*
    ACTIVAR ELEMENTO POR TEXTO
*/

function setActiveNavByText( text ) { 
    const items = document.querySelectorAll( ".main-nav .nav-item" ); 
    
    items.forEach( item => { 
        const itemText = item .querySelector("span") ?.textContent .trim(); 
        item.classList.toggle( "active", itemText === text ); 
    }); 
}

/*
    OCULTAR SECCIONES DE INICIO
*/

function hideHomeSections() { 
    const recentSection = document .getElementById( "recent-books" ) ?.closest( ".library-section" ); 
    const readSection = document .getElementById( "read-books" ) ?.closest( ".library-section" ); 
    
    if (recentSection) { 
        recentSection.hidden = true; 
    } 
    
    if (readSection) { 
        readSection.hidden = true; 
    } 
    
    const empty = document.getElementById( "empty-library" ); 
    
    if (empty) { 
        empty.hidden = true; 
    } 
}

/*
    MOSTRAR SECCIONES DE INICIO
*/

function showHomeSections() { 
    removeDynamicView(); 
    
    const recentSection = document .getElementById( "recent-books" ) ?.closest( ".library-section" ); 
    const readSection = document .getElementById( "read-books" ) ?.closest( ".library-section" ); 
    
    if (recentSection) { 
        recentSection.hidden = false; 
    } 
    
    if (readSection) { 
        readSection.hidden = false; 
    } 
}

/*
    ELIMINAR VISTA DINÁMICA
*/

function removeDynamicView() { 
    document 
        .querySelectorAll( ".dynamic-view" ) 
        .forEach( view => { 
            view.remove(); 
        });
}

/*
    ACTUALIZAR VISTA ACTUAL
*/

function refreshCurrentView() { 
    switch (currentView) { 
        case "home": 
            renderHome(); 
            break; 
        case "all": 
            renderAllBooks(); 
            break; 
        case "read": 
            renderReadBooks(); 
            break; 
        case "favorites": 
            renderFavoriteBooks(); 
            break; 
    } 
}

/*
    ESTADO VACÍO
*/

function updateEmptyState( isEmpty ) { 
    const emptyState = document.getElementById( "empty-library" ); 
    
    if (!emptyState) { 
        return; 
    } 
    
    emptyState.hidden = !isEmpty; 
}

/*
    UTILIDADES
*/

function setText( elementId, value ) { 
    const element = document.getElementById( elementId ); 
    
    if (element) { 
        element.textContent = value; 
    } 
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

