document.addEventListener('DOMContentLoaded', () => {
    const subjectForm = document.getElementById('subjectForm');
    const subjectsList = document.getElementById('subjectsList');
    const searchBox = document.getElementById('searchBox');
    const scrollToTopBtn = document.getElementById('scrollToTopBtn');
    const exportBtn = document.getElementById('exportBtn');
    const importBtn = document.getElementById('importBtn');
    const importFile = document.getElementById('importFile');
    const totalSubjectsElem = document.getElementById('totalSubjects');
    const completedReviewsElem = document.getElementById('completedReviews');
    const sidebar = document.getElementById('sidebar');
    const sidebarToggle = document.getElementById('sidebarToggle');
    const navLinks = document.querySelectorAll('.nav-link');
    let isSidebarCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';

    // Load subjects from Local Storage
    let subjects = JSON.parse(localStorage.getItem('subjects')) || [];
    let currentSection = localStorage.getItem('currentSection') || '#form-section';

    function updateSidebarState() {
        if (isSidebarCollapsed) {
            sidebar.classList.add('collapsed');
            document.querySelector('.content').classList.add('collapsed');
        } else {
            sidebar.classList.remove('collapsed');
            document.querySelector('.content').classList.remove('collapsed');
        }
        localStorage.setItem('sidebarCollapsed', isSidebarCollapsed);
    }

    function updateCurrentSection() {
        const sectionElement = document.querySelector(currentSection);
        if (sectionElement) {
            sectionElement.scrollIntoView({ behavior: 'smooth' });
        }
        navLinks.forEach(link => {
            if (link.getAttribute('href') === currentSection) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
        localStorage.setItem('currentSection', currentSection);
    }

    sidebarToggle.addEventListener('click', () => {
        isSidebarCollapsed = !isSidebarCollapsed;
        updateSidebarState();
    });

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            currentSection = link.getAttribute('href');
            updateCurrentSection();
        });
    });

    updateSidebarState();
    updateCurrentSection();

    subjectForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const name = document.getElementById('subjectName').value;
        const description = document.getElementById('subjectDescription').value;
        const tags = document.getElementById('subjectTags').value.split(',').map(tag => tag.trim());
        addSubject(name, description, tags);
        subjectForm.reset();
    });

    searchBox.addEventListener('input', (event) => {
        const query = event.target.value.toLowerCase();
        displaySubjects(subjects.filter(subject =>
            subject.name.toLowerCase().includes(query) ||
            subject.description.toLowerCase().includes(query) ||
            subject.tags.some(tag => tag.toLowerCase().includes(query))
        ), query);
    });

    exportBtn.addEventListener('click', () => {
        const dataStr = JSON.stringify(subjects, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'subjects.json';
        a.click();
        URL.revokeObjectURL(url);
    });

    importBtn.addEventListener('click', () => {
        importFile.click();
    });

    importFile.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const importedSubjects = JSON.parse(e.target.result);
                subjects = [...subjects, ...importedSubjects];
                saveSubjects();
                displaySubjects(subjects);
                showNotification('Subjects imported successfully');
            };
            reader.readAsText(file);
        }
    });

    function addSubject(name, description, tags) {
        const id = subjects.length ? subjects[subjects.length - 1].id + 1 : 1;
        const entryDate = new Date();
        const firstReviewDate = addDays(entryDate, 1);
        const secondReviewDate = addDays(entryDate, 3);
        const thirdReviewDate = addDays(entryDate, 6);
        const fourthReviewDate = addDays(entryDate, 10);

        const subject = { id, name, description, tags, entryDate, firstReviewDate, secondReviewDate, thirdReviewDate, fourthReviewDate };
        subjects.push(subject);
        saveSubjects();
        displaySubjects(subjects);
        showNotification('Subject added successfully');
        updateStats();
    }

    function displaySubjects(subjects, query = '') {
        subjectsList.innerHTML = '';
        const currentDate = new Date();
        subjects.forEach(subject => {
            const isExpired = date => new Date(date) < currentDate;
            const li = document.createElement('li');
            li.innerHTML = `
                <div class="subject-title">${highlightText(subject.name, query)}</div>
                <div class="details">
                    <p>${highlightText(subject.description, query)}</p>
                    <p>Tags: ${subject.tags.map(tag => `<span class="tag">${highlightText(tag, query)}</span>`).join(', ')}</p>
                    <p class="${isExpired(subject.entryDate) ? 'expired-date' : ''}">Entry Date: ${new Date(subject.entryDate).toLocaleDateString()}</p>
                    <p class="${isExpired(subject.firstReviewDate) ? 'expired-date' : ''}">First Review: ${new Date(subject.firstReviewDate).toLocaleDateString()}</p>
                    <p class="${isExpired(subject.secondReviewDate) ? 'expired-date' : ''}">Second Review: ${new Date(subject.secondReviewDate).toLocaleDateString()}</p>
                    <p class="${isExpired(subject.thirdReviewDate) ? 'expired-date' : ''}">Third Review: ${new Date(subject.thirdReviewDate).toLocaleDateString()}</p>
                    <p class="${isExpired(subject.fourthReviewDate) ? 'expired-date' : ''}">Fourth Review: ${new Date(subject.fourthReviewDate).toLocaleDateString()}</p>
                </div>
                <div class="actions">
                    <button onclick="editSubject(${subject.id})"><span class="material-icons">edit</span> Edit</button>
                    <button onclick="deleteSubject(${subject.id})"><span class="material-icons">delete</span> Delete</button>
                </div>
            `;
            subjectsList.appendChild(li);
        });
        updateStats();
    }

    function highlightText(text, query) {
        if (!query) return text;
        const regex = new RegExp(`(${query})`, 'gi');
        return text.replace(regex, '<mark>$1</mark>');
    }

    function saveSubjects() {
        localStorage.setItem('subjects', JSON.stringify(subjects));
    }

    window.editSubject = (id) => {
        const subject = subjects.find(subject => subject.id === id);
        const newName = prompt('Edit Subject Name', subject.name);
        const newDescription = prompt('Edit Subject Description', subject.description);
        const newTags = prompt('Edit Tags (comma separated)', subject.tags.join(','));

        if (newName !== null && newDescription !== null && newTags !== null) {
            subject.name = newName;
            subject.description = newDescription;
            subject.tags = newTags.split(',').map(tag => tag.trim());
            saveSubjects();
            displaySubjects(subjects);
            showNotification('Subject updated successfully');
        }
    };

    window.deleteSubject = (id) => {
        subjects = subjects.filter(subject => subject.id !== id);
        saveSubjects();
        displaySubjects(subjects);
        showNotification('Subject deleted successfully');
        updateStats();
    };

    function addDays(date, days) {
        const result = new Date(date);
        result.setDate(result.getDate() + days);
        return result;
    }

    function showNotification(message) {
        Toastify({
            text: message,
            duration: 3000,
            close: true,
            gravity: "top",
            position: "right",
            backgroundColor: "#1565c0",
            stopOnFocus: true
        }).showToast();
    }

    // Show or hide the scroll to top button
    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 300) {
            scrollToTopBtn.style.display = 'flex';
        } else {
            scrollToTopBtn.style.display = 'none';
        }
    });

    scrollToTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    function updateStats() {
        const totalSubjects = subjects.length;
        const completedReviews = subjects.filter(subject => subject.reviewed).length;

        totalSubjectsElem.textContent = totalSubjects;
        completedReviewsElem.textContent = completedReviews;
    }

    displaySubjects(subjects);
    updateStats();
});
