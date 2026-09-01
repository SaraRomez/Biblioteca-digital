/* 
    VARIABLES
*/

let books= [];
let currentView = "home";

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
        console.log( "Libro seleccionado:", book ); 
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

