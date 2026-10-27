/* 
    VARIABLES
*/

let books= [];
let currentView = "home";
let previousView = "home";
let currentSearchTerm = "";

/* 
    INICIACIÓN
*/

document.addEventListener("DOMContentLoaded", () => {
    loadBooks();
    setupNavigation();
    setupSearch();
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
        
        loadSavedStates();

        console.log("Catálogo cargado:", books); 

        updateStatistics();
        
        renderHome();

    } catch (error) { 
        console.error( "Error cargando el catálogo:", error ); 
    } 
}

/*
    CARGAR ESTADOS GUARDADOS
*/

function loadSavedStates() {
    const savedStates = localStorage.getItem("libraria-book-states");

    if(!savedStates) {
        return;
    }

    try {
        const states = JSON.parse(savedStates);

        books.forEach(book => {
            const savedState = states[book.id];

            if(!savedState) {
                return;
            }

            if(typeof savedState.favorite === "boolean") {
                book.favorite = savedState.favorite;
            }

            if(typeof savedState.read === "boolean") {
                book.read = savedState.read;
            }
        });

    } catch (error) {
        console.error("No se pudieron cargar los estados guardados: ", error);
    }
}

/*
    GUARDAR ESTADOS
*/  

function saveBookStates() {
    const states = {};

    books.forEach(book => {
        states[book.id] = {
            favorite: Boolean(book.favorite),
            read: Boolean(book.read)
        };
    });

    localStorage.setItem("libraria-book-states", JSON.stringify(states));
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
    showHomeHeader();

    currentSearchTerm = "";
    const searchInput = document.getElementById("global-search"); 
    
    if (searchInput) {
        searchInput.value = ""; 
    }
    
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
    
    mainContent.insertBefore(view, document.querySelector(".footer")); 
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
    
    mainContent.insertBefore( view, document.querySelector(".footer") );
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
    
    mainContent.insertBefore( view, document.querySelector(".footer") ); 
}

/*
    CARGAR AUTORES
*/

function renderAuthors() {
    currentView = "authors";
    hideHomeSections();
    removeDynamicView();

    const mainContent = document.querySelector(".main-content");

    if (!mainContent) {
        return;
    }

    /* 
        Obtenemos los autores únicos de la biblioteca.
        El Set evita que un mismo autor aparezca varias veces.
    */
    const authors = [
        ...new Set(
            books
                .map(book => book.author)
                .filter(Boolean)
        )
    ];

    const section = document.createElement("section");
    section.className = "authors-view dynamic-view";

    section.innerHTML = `
        <div class="section-header">
            <div>
                <span class="section-eyebrow">
                    TU BIBLIOTECA
                </span>

                <h2>
                    Autores
                </h2>
            </div>

            <span class="view-count">
                ${authors.length}
                ${authors.length === 1 ? "autor" : "autores"}
            </span>
        </div>

        <div class="authors-list"></div>
    `;

    const authorsList = section.querySelector(".authors-list");

    /*
        Si no hay autores.
    */
    if (authors.length === 0) {

        authorsList.innerHTML = `
            <div class="inline-empty-state">
                <div class="empty-icon">
                    <i class="fa-solid fa-user"></i>
                </div>

                <h3>
                    No hay autores todavía
                </h3>

                <p>
                    Cuando añadas libros, sus autores aparecerán aquí.
                </p>
            </div>
        `;

    } else {

        /*
            Creamos una sección para cada autor.
        */
        authors.forEach(author => {

            const authorBooks = books.filter(
                book => book.author === author
            );

            const authorSection = document.createElement("section");
            authorSection.className = "library-section author-section";

            authorSection.innerHTML = `
                <div class="section-header">
                    <div>
                        <span class="section-eyebrow">
                            AUTOR
                        </span>

                        <h2>
                            ${escapeHTML(author)}
                        </h2>
                    </div>

                    <span class="view-count">
                        ${authorBooks.length}
                        ${authorBooks.length === 1 ? "libro" : "libros"}
                    </span>
                </div>

                <div class="books-grid author-books-grid"></div>
            `;

            const booksGrid = authorSection.querySelector(
                ".author-books-grid"
            );

            /*
                Utilizamos exactamente las mismas tarjetas
                que ya utiliza el resto de Libraria.
            */
            authorBooks.forEach(book => {
                const card = createBookCard(book);
                booksGrid.appendChild(card);
            });

            authorsList.appendChild(authorSection);
        });
    }

    mainContent.insertBefore(section, document.querySelector(".footer"));
}

/*
    CARGAR GÉNEROS
*/

function renderGenres() {
    currentView = "genres";
    hideHomeSections();
    removeDynamicView();

    const mainContent = document.querySelector(".main-content");

    if (!mainContent) {
        return;
    }

    const genres = [
        ...new Set(
            books
                .map(book => book.genre)
                .filter(Boolean)
        )
    ];

    const section = document.createElement("section");
    section.className = "genres-view dynamic-view";

    section.innerHTML = `
        <div class="section-header">
            <div>
                <span class="section-eyebrow">
                    TU BIBLIOTECA
                </span>

                <h2>
                    Géneros
                </h2>
            </div>

            <span class="view-count">
                ${genres.length}
                ${genres.length === 1 ? "género" : "géneros"}
            </span>
        </div>

        <div class="genres-list"></div>
    `;

    const genresList = section.querySelector(".genres-list");

    if (genres.length === 0) {

        genresList.innerHTML = `
            <div class="inline-empty-state">
                <div class="empty-icon">
                    <i class="fa-solid fa-layer-group"></i>
                </div>

                <h3>
                    No hay géneros todavía
                </h3>

                <p>
                    Cuando añadas libros, sus géneros aparecerán aquí.
                </p>
            </div>
        `;

    } else {

        genres.forEach(genre => {

            const genreBooks = books.filter(
                book => book.genre === genre
            );

            const genreSection = document.createElement("section");
            genreSection.className = "library-section genre-section";

            genreSection.innerHTML = `
                <div class="section-header">
                    <div>
                        <span class="section-eyebrow">
                            GÉNERO
                        </span>

                        <h2>
                            ${escapeHTML(genre)}
                        </h2>
                    </div>

                    <span class="view-count">
                        ${genreBooks.length}
                        ${genreBooks.length === 1 ? "libro" : "libros"}
                    </span>
                </div>

                <div class="books-grid genre-books-grid"></div>
            `;

            const booksGrid = genreSection.querySelector(
                ".genre-books-grid"
            );

            genreBooks.forEach(book => {
                const card = createBookCard(book);
                booksGrid.appendChild(card);
            });

            genresList.appendChild(genreSection);
        });
    }

    mainContent.insertBefore(section,document.querySelector(".footer"));
}

/*
    FUNCIONES AUXILIARES PARA LAS SAGAS
*/

function getBookSeriesName(book) {
    return String(
        book.series ||
        book.saga ||
        book.serie ||
        ""
    ).trim();
}

function getBookSeriesNumber(book) {
    return (
        book.seriesNumber ??
        book.series_number ??
        book.numberInSeries ??
        book.number ??
        ""
    );
}

function compareSeriesBooks(a, b) {
    const numberA = String(getBookSeriesNumber(a)).trim();
    const numberB = String(getBookSeriesNumber(b)).trim();

    const valueA = numberA === ""
        ? null
        : Number(numberA.replace(",", "."));

    const valueB = numberB === ""
        ? null
        : Number(numberB.replace(",", "."));

    // Los libros numerados aparecen antes que los no numerados.
    if (valueA === null && valueB !== null) return 1;
    if (valueA !== null && valueB === null) return -1;

    if (
        valueA !== null &&
        valueB !== null &&
        Number.isFinite(valueA) &&
        Number.isFinite(valueB) &&
        valueA !== valueB
    ) {
        return valueA - valueB;
    }

    return String(a.title || "").localeCompare(
        String(b.title || ""),
        "es",
        { sensitivity: "base" }
    );
}

/*
    CARGAR AUTOCONCLUSIVOS
*/

function renderStandaloneBooks() {
    currentView = "standalone";
    hideHomeSections();
    removeDynamicView();

    const mainContent = document.querySelector(".main-content");

    if (!mainContent) return;

    const standaloneBooks = books.filter(book => {
        const seriesName = getBookSeriesName(book);
        const seriesNumber = String(
            getBookSeriesNumber(book)
        ).trim();

        return !seriesName && !seriesNumber;
    });

    const view = createLibraryView(
        "Autoconclusivos",
        "TU COLECCIÓN",
        standaloneBooks
    );

    mainContent.insertBefore(view, document.querySelector(".footer"));
}

/*
    CARGAR SAGAS
*/

function renderSagas() {
    currentView = "sagas";
    hideHomeSections();
    removeDynamicView();

    const mainContent = document.querySelector(".main-content");

    if (!mainContent) return;

    // Agrupamos los libros por nombre de saga.
    const seriesMap = new Map();

    books.forEach(book => {
        const seriesName = getBookSeriesName(book);

        // Los libros sin saga no aparecen en esta pestaña.
        if (!seriesName) return;

        const key = seriesName.toLocaleLowerCase("es");

        if (!seriesMap.has(key)) {
            seriesMap.set(key, {
                name: seriesName,
                books: []
            });
        }

        seriesMap.get(key).books.push(book);
    });

    // Orden alfabético por nombre de saga.
    const seriesList = [...seriesMap.values()].sort(
        (a, b) => a.name.localeCompare(
            b.name,
            "es",
            { sensitivity: "base" }
        )
    );

    const section = document.createElement("section");
    section.className = "sagas-view dynamic-view";

    section.innerHTML = `
        <div class="section-header">
            <div>
                <span class="section-eyebrow">
                    TU BIBLIOTECA
                </span>

                <h2>Sagas</h2>
            </div>

            <span class="view-count">
                ${seriesList.length}
                ${seriesList.length === 1 ? "saga" : "sagas"}
            </span>
        </div>

        <div class="sagas-list"></div>
    `;

    const sagasList = section.querySelector(".sagas-list");

    if (seriesList.length === 0) {
        sagasList.innerHTML = `
            <div class="inline-empty-state">
                <div class="empty-icon">
                    <i class="fa-solid fa-book-open"></i>
                </div>

                <h3>No hay sagas todavía</h3>

                <p>
                    Cuando añadas libros con una saga asignada,
                    aparecerán aquí agrupados por saga.
                </p>
            </div>
        `;
    } else {
        seriesList.forEach(series => {
            // Ordenamos las entregas dentro de cada saga.
            const seriesBooks = [...series.books].sort(
                compareSeriesBooks
            );

            const sagaSection = document.createElement("section");
            sagaSection.className = "library-section saga-section";

            sagaSection.innerHTML = `
                <div class="section-header">
                    <div>
                        <span class="section-eyebrow">
                            SAGA
                        </span>

                        <h2>${escapeHTML(series.name)}</h2>
                    </div>

                    <span class="view-count">
                        ${seriesBooks.length}
                        ${seriesBooks.length === 1 ? "libro" : "libros"}
                    </span>
                </div>

                <div class="books-grid saga-books-grid"></div>
            `;

            const booksGrid = sagaSection.querySelector(
                ".saga-books-grid"
            );

            // Reutilizamos las tarjetas actuales de Libraria.
            seriesBooks.forEach(book => {
                booksGrid.appendChild(createBookCard(book));
            });

            sagasList.appendChild(sagaSection);
        });
    }

    mainContent.insertBefore(section, document.querySelector(".footer"));
}

/*
    CARGAR RESULTADOS DE BUSQUEDA
*/

function renderSearchResults(searchTerm) { 
    const term = searchTerm .trim() .toLowerCase(); 
    
    /* Si no hay texto de búsqueda, volvemos a Inicio. */ 
    if (!term) { 
        currentSearchTerm = ""; 
        renderHome(); 
        setActiveNavByText("Inicio"); 
        return; 
    } 
    
    /* Guardamos la búsqueda actual. */ 
    currentSearchTerm = searchTerm.trim(); 
    currentView = "search"; 
    hideHomeSections();
    hideHomeHeader();
    removeDynamicView(); 
    
    const mainContent = document.querySelector( ".main-content" ); 
    
    if (!mainContent) { 
        return; 
    } 
    
    /* Buscamos por: - título - autor - género - año */ 
    const results = books.filter(book => { 
        const title = 
            String( book.title || "" ).toLowerCase(); 
        const author = 
            String( book.author || "" ).toLowerCase(); 
        const genre = 
            String( book.genre || "" ).toLowerCase(); 
        const year = 
            String( book.year || "" ).toLowerCase();
        const series = String(
            book.series ||
            book.saga ||
            book.serie ||
            ""
        ).toLowerCase();

        return ( 
            title.includes(term) || 
            author.includes(term) || 
            genre.includes(term) || 
            year.includes(term) ||
            series.includes(term)
        );
    }); 
    
    /* Creamos la sección de resultados. */ 
    const section = document.createElement("section"); 
    section.className = "library-section dynamic-view"; 
    section.innerHTML = ` 
        <div class="section-header"> 
            <div> 
                <span class="section-eyebrow"> BÚSQUEDA </span> 
                <h2> Resultados para "${escapeHTML(searchTerm)}" </h2> 
            </div> 
            <span class="view-count"> ${results.length} ${ results.length === 1 ? "libro" : "libros" } </span> 
        </div> 
        <div class="books-grid dynamic-books-grid"></div> 
    `; 
    
    const grid = section.querySelector( ".dynamic-books-grid" ); 
    
    /* SIN RESULTADOS */ 
    if (results.length === 0) { 
        grid.innerHTML = ` 
            <div class="inline-empty-state"> 
                <div class="empty-icon"> 
                    <i class="fa-solid fa-magnifying-glass"></i> 
                </div> 
                <h3> No encontramos ningún libro </h3> 
                <p> Prueba con otro título, autor, género o año. </p> 
            </div> 
        `; 
    } else { 
        /* MOSTRAR RESULTADOS */ 
        results.forEach(book => { 
            const card = createBookCard(book); 
            grid.appendChild(card); 
        }); 
    } 
    
    mainContent.insertBefore(section, document.querySelector(".footer")); 
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
    
    const seriesName = String(
        book.series ||
        book.saga ||
        book.serie ||
        ""
    ).trim();
    const seriesNumber =
        book.seriesNumber ??
        book.series_number ??
        book.numberInSeries ??
        "";
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
                    ${seriesName ? `<span>${escapeHTML(seriesName)}</span>` : ""}
                    ${seriesName && String(seriesNumber).trim() !== "" ? `<span>${escapeHTML(String(seriesNumber))}</span>` : ""}
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

            case "authors":
                setActiveNavByText("Autores");
                renderAuthors();
                break;

            case "search": 
                renderSearchResults( currentSearchTerm ); 
                break;

            case "standalone":
                setActiveNavByText("AutoConclusivos");
                renderStandaloneBooks();
                break;

            case "sagas":
                setActiveNavByText("Sagas");
                renderSagas();
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

    mainContent.insertBefore( view, document.querySelector(".footer") );
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
    saveBookStates();
    console.log(
        `${book.title}:`, 
        book.favorite 
            ? "Añadido a favoritos" 
            : "Eliminado de favoritos" 
    );
    
    /* Actualizamos las estadísticas.*/ 
    updateStatistics(); 
    
    if (currentView === "detail") { 
        const savedPreviousView = previousView; 
        renderBookDetail(book);
        previousView = savedPreviousView; 
        return; 
    }
    /*Actualizamos la vista actual*/
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
    saveBookStates();

    console.log(
        `${book.title}:`,
        book.read
            ? "Marcado como leído"
            : "Marcado como no leído"
    );

    updateStatistics();

    if (currentView === "detail") { 
        const savedPreviousView = previousView; 
        renderBookDetail(book); 
        previousView = savedPreviousView; 
        return; 
    }

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
                    renderAuthors(); 
                    break; 

                case "Géneros": 
                    renderGenres(); 
                    break;

                case "AutoConclusivos":
                    renderStandaloneBooks();
                    break;

                case "Sagas":
                    renderSagas();
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
    BUSCADOR
*/

function setupSearch() { 
    const searchInput = document.getElementById( "global-search" ); 
    
    if (!searchInput) { 
        return; 
    } 
    
    /*Buscar mientras escribimos.*/ 
    searchInput.addEventListener( "input", () => { 
        const value = searchInput.value.trim(); 
        
        /*Si está vacío, volvemos a Inicio.*/ 
        if (!value) { 
            currentSearchTerm = ""; 
            renderHome(); 
            setActiveNavByText( "Inicio" ); 
            return; 
        } 
        
        /*Mostramos resultados.*/ 
        renderSearchResults(value); 
    }); 
    
    /*ENTER → confirmar búsqueda*/
    searchInput.addEventListener( "keydown", event => { 
        if (event.key === "Enter") { 
            event.preventDefault(); 
            const value = searchInput.value.trim(); 
            
            if (value) { 
                renderSearchResults( value ); 
            } 
        } 
    }); 
    
    /*ESC → limpiar búsqueda*/ 
    searchInput.addEventListener( "keydown", event => { 
        if (event.key === "Escape") { 
            searchInput.value = ""; 
            currentSearchTerm = ""; 
            renderHome(); 
            setActiveNavByText( "Inicio" ); 
        } 
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
    hideHomeHeader();
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
    MOSTRAR/OCULTAR HERO Y ESTADISTICAS
*/

function hideHomeHeader() {
    const hero = document.querySelector(".hero");
    const stats = document.querySelector(".stats-grid");

    if (hero) {
        hero.hidden = true;
    }

    if (stats) {
        stats.hidden = true;
    }
}

function showHomeHeader() {
    const hero = document.querySelector(".hero");
    const stats = document.querySelector(".stats-grid");

    if (hero) {
        hero.hidden = false;
    }

    if (stats) {
        stats.hidden = false;
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

        case "authors":
            renderAuthors();
            break;

        case "genres":
            renderGenres();
            break;
        
        case "standalone":
            renderStandaloneBooks();
            break;

        case "sagas":
            renderSagas();
            break;

        case "search": 
            renderSearchResults( currentSearchTerm ); 
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

